export interface CategoryDefinition {
  id: number
  name: string
  nameAr: string
  nameFr: string
  icon?: any // Optional for backward compatibility
  iconImage?: string // Path to icon image
  color: string
  iconColor: string
}

export interface StoreDefinition {
  id: number
  name: string
  type: string
  rating: number
  deliveryTime: string
  categoryId: number
}

export interface ProductDefinition {
  id: number
  storeId: number
  name: string
  description: string
  price: number
  image: string
  rating: number
}

export const categories: CategoryDefinition[] = [
  {
    id: 1,
    name: 'Shops',
    nameAr: 'متاجر',
    nameFr: 'Boutiques',
    iconImage: '/icons/gifts.png', // Smartphone with storefront and shopping cart
    color: 'bg-gradient-to-br from-emerald-100 to-green-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 2,
    name: 'Pharmacy & Beauty',
    nameAr: 'صيدلية وتجميل',
    nameFr: 'Pharmacie & Beauté',
    iconImage: '/icons/beauty.png', // Makeup products (lipstick, compacts)
    color: 'bg-gradient-to-br from-pink-100 to-rose-50',
    iconColor: 'text-pink-500',
  },
  {
    id: 3,
    name: 'Groceries',
    nameAr: 'بقالة',
    nameFr: 'Épicerie',
    iconImage: '/icons/groceries.png', // Shopping cart with groceries
    color: 'bg-gradient-to-br from-orange-100 to-amber-50',
    iconColor: 'text-orange-500',
  },
  {
    id: 4,
    name: 'Food',
    nameAr: 'طعام',
    nameFr: 'Nourriture',
    iconImage: '/icons/restaurants.png', // Food items (hamburger, pizza, etc.)
    color: 'bg-gradient-to-br from-orange-100 to-yellow-50',
    iconColor: 'text-orange-600',
  },
  {
    id: 5,
    name: 'Package Delivery',
    nameAr: 'توصيل الطرود',
    nameFr: 'Livraison de colis',
    iconImage: '/icons/package-delivery.png', // Delivery scooter with package
    color: 'bg-gradient-to-br from-yellow-100 to-amber-50',
    iconColor: 'text-yellow-600',
  },
]

export const stores: StoreDefinition[] = [
  { id: 1, name: 'Le Taj Mahal', type: 'Cuisine Indienne', rating: 4.5, deliveryTime: '30-45 min', categoryId: 1 },
  { id: 2, name: 'Supermarché Numidis', type: 'Supermarché', rating: 4.7, deliveryTime: '20-30 min', categoryId: 2 },
  { id: 3, name: 'Pharmacie El Hakim', type: 'Pharmacie', rating: 4.8, deliveryTime: '15-25 min', categoryId: 3 },
  { id: 4, name: 'Pizza Napoli', type: 'Pizzeria', rating: 4.6, deliveryTime: '25-35 min', categoryId: 1 },
  { id: 5, name: 'Express Colis', type: 'Livraison', rating: 4.9, deliveryTime: 'Même jour', categoryId: 4 },
  {
    id: 6,
    name: 'Boutique Souvenirs',
    type: 'Cadeaux & Artisanat',
    rating: 4.4,
    deliveryTime: '40-50 min',
    categoryId: 5,
  },
]

export const products: ProductDefinition[] = [
  {
    id: 1,
    storeId: 1,
    name: 'Poulet Tikka Masala',
    description: 'Poulet mariné dans une sauce crémeuse aux épices',
    price: 1200,
    image: '/chicken-tikka-masala.png',
    rating: 4.5,
  },
  {
    id: 2,
    storeId: 1,
    name: 'Biryani aux Légumes',
    description: 'Riz basmati parfumé avec légumes et épices',
    price: 900,
    image: '/vegetable-biryani.png',
    rating: 4.7,
  },
  {
    id: 3,
    storeId: 1,
    name: 'Naan au Fromage',
    description: 'Pain indien traditionnel garni de fromage',
    price: 350,
    image: '/cheese-naan-bread.jpg',
    rating: 4.8,
  },
  {
    id: 4,
    storeId: 2,
    name: "Lait Candia 1L",
    description: 'Lait demi-écrémé UHT',
    price: 120,
    image: '/milk-carton.png',
    rating: 4.6,
  },
  {
    id: 5,
    storeId: 2,
    name: 'Pain Complet',
    description: 'Pain frais du jour',
    price: 80,
    image: '/whole-wheat-bread.png',
    rating: 4.9,
  },
  {
    id: 6,
    storeId: 2,
    name: "Huile d'Olive 1L",
    description: "Huile d'olive extra vierge",
    price: 650,
    image: '/olive-oil-bottle.png',
    rating: 4.4,
  },
  {
    id: 7,
    storeId: 4,
    name: 'Pizza Margherita',
    description: 'Tomate, mozzarella, basilic frais',
    price: 1100,
    image: '/margherita-pizza.png',
    rating: 4.8,
  },
  {
    id: 8,
    storeId: 4,
    name: 'Pizza 4 Fromages',
    description: 'Mozzarella, gorgonzola, parmesan, chèvre',
    price: 1300,
    image: '/four-cheese-pizza.png',
    rating: 4.6,
  },
  {
    id: 9,
    storeId: 4,
    name: 'Pizza Végétarienne',
    description: 'Légumes grillés, olives, champignons',
    price: 1200,
    image: '/vegetarian-pizza.jpg',
    rating: 4.7,
  },
]

export const cities = ['Alger', 'Ouargla', 'Ghardaïa', 'Tamanrasset']

