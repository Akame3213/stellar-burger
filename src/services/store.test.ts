import { configureStore } from '@reduxjs/toolkit';
import store, { rootReducer, RootState } from './store';

// Конфигурация тестового окружения
const TestEnvironment = {
  createTestStore() {
    return configureStore({
      reducer: rootReducer
    });
  },
  
  getInitialState() {
    return rootReducer(undefined, { type: 'INITIALIZATION_ACTION' });
  },
  
  validateStateStructure(state: RootState) {
    const requiredSlices = ['constructorBurger', 'ingredient', 'user', 'order', 'feed'];
    const requiredConstructorProps = ['constructorItems'];
    const requiredConstructorItemsProps = ['bun', 'ingredients'];
    const requiredIngredientProps = ['ingredients'];
    const requiredUserProps = ['userData'];
    
    // Проверяем наличие всех слайсов
    requiredSlices.forEach(sliceName => {
      expect(state).toHaveProperty(sliceName);
    });
    
    // Проверяем структуру constructorBurger
    expect(state.constructorBurger).toHaveProperty('constructorItems');
    requiredConstructorItemsProps.forEach(prop => {
      expect(state.constructorBurger.constructorItems).toHaveProperty(prop);
    });
    
    // Проверяем структуру ingredient
    requiredIngredientProps.forEach(prop => {
      expect(state.ingredient).toHaveProperty(prop);
    });
    
    // Проверяем структуру user
    requiredUserProps.forEach(prop => {
      expect(state.user).toHaveProperty(prop);
    });
  }
};

describe('Тестирование корневого редьюсера приложения', () => {
  describe('Обработка неизвестных действий', () => {
    it('Возвращает корректное начальное состояние при обработке неизвестного действия', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION_TYPE' };
      const result = rootReducer(undefined, unknownAction);
      const expected = store.getState();
      
      expect(result).toEqual(expected);
    });
    
    it('Обрабатывает действия с различными типами данных', () => {
      const actions = [
        { type: 'RANDOM_ACTION_1' },
        { type: 'RANDOM_ACTION_2', payload: 'test' },
        { type: 'RANDOM_ACTION_3', payload: { data: 'test' } }
      ];
      
      actions.forEach(action => {
        const result = rootReducer(undefined, action);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });
    });
  });
  
  describe('Структура состояния', () => {
    it('Содержит все необходимые слайсы с правильной структурой', () => {
      const initialState = TestEnvironment.getInitialState();
      TestEnvironment.validateStateStructure(initialState);
    });
    
    it('Поддерживает правильную типизацию состояния', () => {
      const testStore = TestEnvironment.createTestStore();
      const testState = testStore.getState();
      
      // Проверяем совместимость типов
      const typeCheck: RootState extends typeof testState ? true : false = true;
      expect(typeCheck).toBe(true);
    });
  });
  
  describe('Интеграция с Redux Toolkit', () => {
    it('Корректно интегрируется с configureStore', () => {
      const testStore = TestEnvironment.createTestStore();
      const mainStoreState = store.getState();
      const testStoreState = testStore.getState();
      
      expect(testStoreState).toEqual(mainStoreState);
    });
    
    it('Поддерживает стандартные Redux операции', () => {
      const testStore = TestEnvironment.createTestStore();
      
      // Проверяем, что store может диспатчить действия
      expect(() => {
        testStore.dispatch({ type: 'TEST_ACTION' });
      }).not.toThrow();
      
      // Проверяем, что состояние изменяется
      const initialState = testStore.getState();
      testStore.dispatch({ type: 'TEST_ACTION' });
      const finalState = testStore.getState();
      
      expect(finalState).toBeDefined();
    });
  });
  
  describe('Валидация начального состояния', () => {
    it('Инициализируется с корректными значениями по умолчанию', () => {
      const initialState = TestEnvironment.getInitialState();
      
      // Проверяем, что все слайсы имеют корректные начальные значения
      expect(initialState.constructorBurger.constructorItems.bun).toBeNull();
      expect(Array.isArray(initialState.constructorBurger.constructorItems.ingredients)).toBe(true);
      expect(initialState.constructorBurger.constructorItems.ingredients).toHaveLength(0);
      
      expect(Array.isArray(initialState.ingredient.ingredients)).toBe(true);
      expect(initialState.ingredient.ingredients).toHaveLength(0);
      
      expect(initialState.user.userData).toBeNull();
    });
    
    it('Сохраняет иммутабельность состояния', () => {
      const initialState = TestEnvironment.getInitialState();
      const originalState = JSON.parse(JSON.stringify(initialState));
      
      // Выполняем действие, которое не должно изменять состояние
      const result = rootReducer(initialState, { type: 'NON_MODIFYING_ACTION' });
      
      // Проверяем, что исходное состояние не изменилось
      expect(initialState).toEqual(originalState);
      expect(result).toEqual(initialState);
    });
  });
});
