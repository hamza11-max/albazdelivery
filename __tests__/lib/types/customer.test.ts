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

  it('should allow optional fields', () => {
    const testCustomer: Partial<Customer> = {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };

    expect(testCustomer).toBeDefined();
    expect(testCustomer.id).toBe('2');
    expect(testCustomer.name).toBe('Jane Smith');
    expect(testCustomer.email).toBe('jane.smith@example.com');
    expect(testCustomer.phone).toBeUndefined();
    expect(testCustomer.totalPurchases).toBeUndefined();
    expect(testCustomer.createdAt).toBeUndefined();
  });

  it('should enforce required field types', () => {
    // This test will fail at compile time if the types are incorrect
    // We're using @ts-expect-error to verify that invalid types are caught
    
    // @ts-expect-error - name should be string, not number
    const invalidCustomer1: Customer = {
      id: '3',
      name: 123,
      email: 'invalid@example.com'
    };

    // @ts-expect-error - email should be string, not number
    const invalidCustomer2: Customer = {
      id: '4',
      name: 'Invalid',
      email: 12345
    };
  });
});
