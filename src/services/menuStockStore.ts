// @ts-nocheck
// Cravingza Menu Item Stock Sync Store
// Bridges Restaurant Admin stock toggles ("In Stock" / "Out of Stock")
// with real-time updates on Customer App (HomeScreen & RestaurantDetailScreen)

type StockSyncListener = () => void;

let listeners: StockSyncListener[] = [];
// Map of dish ID or dish name (lowercase) -> isOutOfStock boolean
const outOfStockMap: Record<string, boolean> = {
  // Demo defaults
  '102': true, // e.g. Garlic Butter Crust Sticks default test out of stock if needed
};

export const getOutOfStockMap = () => ({ ...outOfStockMap });

export const isDishOutOfStock = (dishIdOrName?: string): boolean => {
  if (!dishIdOrName) return false;
  const key = String(dishIdOrName).trim().toLowerCase();
  if (typeof outOfStockMap[dishIdOrName] === 'boolean') {
    return outOfStockMap[dishIdOrName];
  }
  if (typeof outOfStockMap[key] === 'boolean') {
    return outOfStockMap[key];
  }
  return false;
};

export const setDishStockStatus = (dishIdOrName: string, isOutOfStock: boolean) => {
  if (!dishIdOrName) return;
  const key = String(dishIdOrName).trim().toLowerCase();
  outOfStockMap[dishIdOrName] = isOutOfStock;
  outOfStockMap[key] = isOutOfStock;
  notifyListeners();
};

export const toggleDishStockStatus = (dishIdOrName: string, currentStockState?: boolean) => {
  if (!dishIdOrName) return;
  const currentState = typeof currentStockState === 'boolean'
    ? !currentStockState
    : !isDishOutOfStock(dishIdOrName);
  
  setDishStockStatus(dishIdOrName, currentState);
  return currentState;
};

export const subscribeMenuStockSync = (listener: StockSyncListener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {}
  });
};
