# Sends a file to a Windows printer as RAW bytes through the print spooler
# (winspool.drv), so ESC/POS commands reach the printer unchanged.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File raw-print.ps1 -Printer "<name>" -Path "<file>"
param(
  [Parameter(Mandatory = $true)][string]$Printer,
  [Parameter(Mandatory = $true)][string]$Path
)

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class AlbazRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public class DOCINFO {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }

  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool ClosePrinter(IntPtr handle);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern int StartDocPrinter(IntPtr handle, int level, [In] DOCINFO info);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool EndDocPrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool StartPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool EndPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool WritePrinter(IntPtr handle, byte[] bytes, int count, out int written);

  public static void Send(string printer, byte[] bytes) {
    IntPtr h;
    if (!OpenPrinter(printer, out h, IntPtr.Zero)) throw new Win32Exception(Marshal.GetLastWin32Error(), "OpenPrinter failed");
    try {
      var info = new DOCINFO { pDocName = "AL-baz receipt", pDataType = "RAW" };
      if (StartDocPrinter(h, 1, info) == 0) throw new Win32Exception(Marshal.GetLastWin32Error(), "StartDocPrinter failed");
      try {
        if (!StartPagePrinter(h)) throw new Win32Exception(Marshal.GetLastWin32Error(), "StartPagePrinter failed");
        int written;
        bool ok = WritePrinter(h, bytes, bytes.Length, out written);
        int err = Marshal.GetLastWin32Error();
        EndPagePrinter(h);
        if (!ok) throw new Win32Exception(err, "WritePrinter failed");
        if (written != bytes.Length) throw new Exception("WritePrinter wrote " + written + " of " + bytes.Length + " bytes");
      } finally {
        EndDocPrinter(h);
      }
    } finally {
      ClosePrinter(h);
    }
  }
}
'@

[AlbazRawPrinter]::Send($Printer, [System.IO.File]::ReadAllBytes($Path))
Write-Output "OK $((Get-Item $Path).Length) bytes"
