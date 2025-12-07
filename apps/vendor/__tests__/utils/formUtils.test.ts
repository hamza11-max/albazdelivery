import { resetProductForm, resetCustomerForm } from '../../utils/formUtils'

describe('formUtils', () => {
  describe('resetProductForm', () => {
    it('should return empty product form', () => {
      const form = resetProductForm()
      
      expect(form).toEqual({
        sku: '',
        name: '',
        category: '',
        description: '',
        supplierId: '',
        costPrice: '',
        sellingPrice: '',
        price: '',
        stock: 0,
        lowStockThreshold: 0,
        barcode: '',
        image: '',
      })
    })
  })

  describe('resetCustomerForm', () => {
    it('should return empty customer form', () => {
      const form = resetCustomerForm()
      
      expect(form).toEqual({
        name: '',
        email: '',
        phone: '',
        address: '',
      })
    })
  })
})


