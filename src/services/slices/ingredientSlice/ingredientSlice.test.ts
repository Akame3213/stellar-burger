import ingredientSlice, {
  getIngredients,
  initialState,
  getIngredientState
} from './ingredientSlice';
import { TIngredient } from '../../../utils/types';

// Тестовые данные
const MockIngredients: TIngredient[] = [
  {
    _id: '643d69a5c3f7b9001cfa093c',
    name: 'Краторная булка N-200i',
    type: 'bun',
    proteins: 80,
    fat: 24,
    carbohydrates: 53,
    calories: 420,
    price: 1255,
    image: 'https://code.s3.yandex.net/react/code/bun-02.png',
    image_mobile: 'https://code.s3.yandex.net/react/code/bun-02-mobile.png',
    image_large: 'https://code.s3.yandex.net/react/code/bun-02-large.png'
  },
  {
    _id: '643d69a5c3f7b9001cfa0942',
    name: 'Соус Spicy-X',
    type: 'sauce',
    proteins: 30,
    fat: 20,
    carbohydrates: 40,
    calories: 30,
    price: 90,
    image: 'https://code.s3.yandex.net/react/code/sauce-02.png',
    image_mobile: 'https://code.s3.yandex.net/react/code/sauce-02-mobile.png',
    image_large: 'https://code.s3.yandex.net/react/code/sauce-02-large.png'
  }
];

// Утилиты для тестирования
const TestHelpers = {
  createLoadingState() {
    return {
      ...initialState,
      loading: true
    };
  },
  
  createErrorState(errorMessage: string) {
    return {
      ...initialState,
      error: errorMessage
    };
  },
  
  createLoadedState(ingredients: TIngredient[]) {
    return {
      ...initialState,
      ingredients
    };
  },
  
  validateIngredientData(ingredient: TIngredient) {
    expect(ingredient).toHaveProperty('_id');
    expect(ingredient).toHaveProperty('name');
    expect(ingredient).toHaveProperty('type');
    expect(ingredient).toHaveProperty('price');
    expect(typeof ingredient._id).toBe('string');
    expect(typeof ingredient.name).toBe('string');
    expect(typeof ingredient.price).toBe('number');
  }
};

describe('Тестирование редьюсера ингредиентов', () => {
  describe('Инициализация состояния', () => {
    it('Возвращает корректное начальное состояние', () => {
      const result = ingredientSlice(undefined, { type: 'INIT' });
      expect(result).toEqual(initialState);
    });

    it('Поддерживает иммутабельность при неизвестных действиях', () => {
      const testState = TestHelpers.createLoadedState(MockIngredients);
      const originalState = JSON.parse(JSON.stringify(testState));
      
      const result = ingredientSlice(testState, { type: 'UNKNOWN_ACTION' });
      
      expect(testState).toEqual(originalState);
      expect(result).toEqual(testState);
    });
  });

  describe('Обработка асинхронных действий', () => {
    describe('Начало загрузки ингредиентов', () => {
      it('Устанавливает флаг загрузки при начале запроса', () => {
        const action = { type: getIngredients.pending.type };
        const newState = ingredientSlice(initialState, action);
        
        expect(newState.loading).toBe(true);
        expect(newState.error).toBe(null);
      });

      it('Сбрасывает ошибку при повторной попытке загрузки', () => {
        const stateWithError = TestHelpers.createErrorState('Previous error');
        const action = { type: getIngredients.pending.type };
        
        const newState = ingredientSlice(stateWithError, action);
        
        expect(newState.loading).toBe(true);
        expect(newState.error).toBe(null);
      });
    });

    describe('Успешная загрузка ингредиентов', () => {
      it('Сохраняет загруженные ингредиенты в состоянии', () => {
        const action = {
          type: getIngredients.fulfilled.type,
          payload: MockIngredients
        };
        
        const newState = ingredientSlice(initialState, action);
        
        expect(newState.loading).toBe(false);
        expect(newState.ingredients).toEqual(MockIngredients);
        expect(newState.error).toBe(null);
      });

      it('Валидирует структуру загруженных ингредиентов', () => {
        const action = {
          type: getIngredients.fulfilled.type,
          payload: MockIngredients
        };
        
        const newState = ingredientSlice(initialState, action);
        
        newState.ingredients.forEach(ingredient => {
          TestHelpers.validateIngredientData(ingredient);
        });
      });

      it('Обрабатывает пустой массив ингредиентов', () => {
        const action = {
          type: getIngredients.fulfilled.type,
          payload: []
        };
        
        const newState = ingredientSlice(initialState, action);
        
        expect(newState.loading).toBe(false);
        expect(newState.ingredients).toEqual([]);
        expect(newState.error).toBe(null);
      });

      it('Обрабатывает null в качестве ответа', () => {
        const action = {
          type: getIngredients.fulfilled.type,
          payload: null
        };
        
        const newState = ingredientSlice(initialState, action);
        
        expect(newState.loading).toBe(false);
        expect(newState.ingredients).toBeNull();
        expect(newState.error).toBe(null);
      });
    });

    describe('Обработка ошибок загрузки', () => {
      it('Сохраняет сообщение об ошибке при неудачном запросе', () => {
        const errorMessage = 'Network connection failed';
        const action = {
          type: getIngredients.rejected.type,
          error: { message: errorMessage }
        };
        
        const newState = ingredientSlice(initialState, action);
        
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe(errorMessage);
      });

      it('Сохраняет детальную информацию об ошибке', () => {
        const detailedError = 'Database connection timeout: 5000ms';
        const action = {
          type: getIngredients.rejected.type,
          error: { message: detailedError }
        };
        
        const newState = ingredientSlice(initialState, action);
        
        expect(newState.error).toBe(detailedError);
        expect(newState.loading).toBe(false);
      });

      it('Не изменяет существующие ингредиенты при ошибке', () => {
        const stateWithIngredients = TestHelpers.createLoadedState(MockIngredients);
        const errorMessage = 'API error';
        const action = {
          type: getIngredients.rejected.type,
          error: { message: errorMessage }
        };
        
        const newState = ingredientSlice(stateWithIngredients, action);
        
        expect(newState.ingredients).toEqual(MockIngredients);
        expect(newState.error).toBe(errorMessage);
        expect(newState.loading).toBe(false);
      });
    });
  });

  describe('Последовательные операции', () => {
    it('Корректно обрабатывает полный цикл загрузки', () => {
      let state = ingredientSlice(initialState, { type: getIngredients.pending.type });
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      state = ingredientSlice(state, {
        type: getIngredients.fulfilled.type,
        payload: MockIngredients
      });
      expect(state.loading).toBe(false);
      expect(state.ingredients).toEqual(MockIngredients);
      expect(state.error).toBe(null);
    });

    it('Обрабатывает повторные попытки загрузки после ошибки', () => {
      let state = ingredientSlice(initialState, { type: getIngredients.pending.type });
      expect(state.loading).toBe(true);
      
      state = ingredientSlice(state, {
        type: getIngredients.rejected.type,
        error: { message: 'First error' }
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBe('First error');
      
      state = ingredientSlice(state, { type: getIngredients.pending.type });
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      state = ingredientSlice(state, {
        type: getIngredients.fulfilled.type,
        payload: MockIngredients
      });
      expect(state.loading).toBe(false);
      expect(state.ingredients).toEqual(MockIngredients);
      expect(state.error).toBe(null);
    });

    it('Поддерживает множественные операции загрузки', () => {
      let state = ingredientSlice(initialState, { type: getIngredients.pending.type });
      state = ingredientSlice(state, { type: getIngredients.pending.type });
      state = ingredientSlice(state, { type: getIngredients.pending.type });
      
      expect(state.loading).toBe(true);
      
      state = ingredientSlice(state, {
        type: getIngredients.fulfilled.type,
        payload: MockIngredients
      });
      
      expect(state.loading).toBe(false);
      expect(state.ingredients).toEqual(MockIngredients);
    });
  });

  describe('Валидация данных', () => {
    it('Проверяет корректность структуры ингредиентов', () => {
      const action = {
        type: getIngredients.fulfilled.type,
        payload: MockIngredients
      };
      
      const newState = ingredientSlice(initialState, action);
      
      newState.ingredients.forEach(ingredient => {
        expect(ingredient).toHaveProperty('_id');
        expect(ingredient).toHaveProperty('name');
        expect(ingredient).toHaveProperty('type');
        expect(ingredient).toHaveProperty('proteins');
        expect(ingredient).toHaveProperty('fat');
        expect(ingredient).toHaveProperty('carbohydrates');
        expect(ingredient).toHaveProperty('calories');
        expect(ingredient).toHaveProperty('price');
        expect(ingredient).toHaveProperty('image');
        expect(ingredient).toHaveProperty('image_mobile');
        expect(ingredient).toHaveProperty('image_large');
      });
    });

    it('Обрабатывает ингредиенты с различными типами', () => {
      const mixedIngredients = [
        { ...MockIngredients[0], type: 'bun' },
        { ...MockIngredients[1], type: 'sauce' },
        { ...MockIngredients[0], _id: 'test-main', type: 'main' }
      ];
      
      const action = {
        type: getIngredients.fulfilled.type,
        payload: mixedIngredients
      };
      
      const newState = ingredientSlice(initialState, action);
      
      expect(newState.ingredients).toHaveLength(3);
      expect(newState.ingredients[0].type).toBe('bun');
      expect(newState.ingredients[1].type).toBe('sauce');
      expect(newState.ingredients[2].type).toBe('main');
    });
  });
});
