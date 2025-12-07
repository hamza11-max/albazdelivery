import { Customer } from '@/lib/types/customer';

describe('Customer Type', () => {
  it('should have the correct type structure', () => {
    const testCustomer: Customer = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      totalPurchases: 5,
      createdAt: new Date('2023-01-01')
    };

    expect(testCustomer).toBeDefined();
    expect(typeof testCustomer.id).toBe('string');
    expect(typeof testCustomer.name).toBe('string');
    expect(typeof testCustomer.email).toBe('string');
    expect(typeof testCustomer.phone).toBe('string');
    expect(typeof testCustomer.totalPurchases).toBe('number');
    expect(testCustomer.createdAt).toBeInstanceOf(Date);
  });
});
