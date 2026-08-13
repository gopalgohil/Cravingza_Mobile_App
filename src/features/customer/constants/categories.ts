export interface CategoryItem {
  id: string;
  name: string;
  image: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: '1',
    name: 'All',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop&q=60',
  },
  {
    id: '2',
    name: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=60',
  },
  {
    id: '3',
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60',
  },
  {
    id: '4',
    name: 'Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    name: 'Desserts',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&auto=format&fit=crop&q=60',
  },
  {
    id: '6',
    name: 'Healthy',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=60',
  },
];
