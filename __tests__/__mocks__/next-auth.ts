export const getServerSession = jest.fn().mockResolvedValue({
  user: {
    id: 'test-user',
    name: 'Test User',
    email: 'test@test.com',
    role: 'customer'
  },
  expires: new Date(Date.now() + 2 * 86400).toISOString()
});

export const auth = {
  update: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn()
};