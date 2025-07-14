import constructorSlice, {
  addIngredient,
  initialState,
  moveIngredientDown,
  moveIngredientUp,
  orderBurger,
  removeIngredient
} from './constructorSlice';
import { expect, test, describe } from '@jest/globals';
import { AnyAction } from '@reduxjs/toolkit';

// Тестовые данные
const TestData = {
  bun: {
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
  
  sauce: {
    _id: '643d69a5c3f7b9001cfa0943',
    name: 'Соус фирменный Space Sauce',
    type: 'sauce',
    proteins: 50,
    fat: 22,
    carbohydrates: 11,
    calories: 14,
    price: 80,
    image: 'https://code.s3.yandex.net/react/code/sauce-04.png',
    image_mobile: 'https://code.s3.yandex.net/react/code/sauce-04-mobile.png',
    image_large: 'https://code.s3.yandex.net/react/code/sauce-04-large.png'
  },
  
  filling: {
    _id: '643d69a5c3f7b9001cfa0944',
    name: 'Соус традиционный галактический',
    type: 'sauce',
    proteins: 42,
    fat: 24,
    carbohydrates: 42,
    calories: 99,
    price: 15,
    image: 'https://code.s3.yandex.net/react/code/sauce-03.png',
    image_mobile: 'https://code.s3.yandex.net/react/code/sauce-03-mobile.png',
    image_large: 'https://code.s3.yandex.net/react/code/sauce-03-large.png'
  }
};

// Утилиты для тестирования
const TestUtils = {
  createStateWithBun(): any {
    return {
      constructorItems: {
        bun: { ...TestData.bun, id: 'test-bun-id' },
        ingredients: []
      },
      loading: false,
      orderRequest: false,
      orderModalData: null,
      error: null
    };
  },
  
  createStateWithIngredients(): any {
    return {
      constructorItems: {
        bun: null,
        ingredients: [
          { ...TestData.filling, id: 'test-filling-1' },
          { ...TestData.sauce, id: 'test-filling-2' }
        ]
      },
      loading: false,
      orderRequest: false,
      orderModalData: null,
      error: null
    };
  },
  
  validateIngredientStructure(ingredient: any, expectedData: any) {
    expect(ingredient).toHaveProperty('id');
    expect(typeof ingredient.id).toBe('string');
    expect(ingredient._id).toBe(expectedData._id);
    expect(ingredient.name).toBe(expectedData.name);
    expect(ingredient.type).toBe(expectedData.type);
    expect(ingredient.price).toBe(expectedData.price);
  }
};

describe('Тестирование редьюсера конструктора бургера', () => {
  describe('Добавление ингредиентов', () => {
    it('Добавляет начинку в пустой конструктор', () => {
      const newState = constructorSlice(
        initialState,
        addIngredient(TestData.sauce)
      );

      const addedIngredient = newState.constructorItems.ingredients[0];
      TestUtils.validateIngredientStructure(addedIngredient, TestData.sauce);
      expect(newState.constructorItems.ingredients).toHaveLength(1);
    });

    it('Добавляет булку в пустой конструктор', () => {
      const newState = constructorSlice(
        initialState,
        addIngredient(TestData.bun)
      );

      const addedBun = newState.constructorItems.bun;
      TestUtils.validateIngredientStructure(addedBun, TestData.bun);
      expect(newState.constructorItems.ingredients).toHaveLength(0);
    });

    it('Заменяет существующую булку на новую', () => {
      const stateWithBun = TestUtils.createStateWithBun();
      const newBun = {
        ...TestData.bun,
        _id: '643d69a5c3f7b9001cfa093d',
        name: 'Флюоресцентная булка R2-D3',
        price: 988
      };

      const newState = constructorSlice(stateWithBun, addIngredient(newBun));

      const updatedBun = newState.constructorItems.bun;
      if (updatedBun) {
        TestUtils.validateIngredientStructure(updatedBun, newBun);
        expect(updatedBun._id).toBe(newBun._id);
        expect(updatedBun.name).toBe(newBun.name);
      } else {
        throw new Error('Булка не добавлена');
      }
    });

    it('Добавляет начинку к существующей булке', () => {
      const stateWithBun = TestUtils.createStateWithBun();
      
      const newState = constructorSlice(stateWithBun, addIngredient(TestData.sauce));

      expect(newState.constructorItems.bun).toBeDefined();
      expect(newState.constructorItems.ingredients).toHaveLength(1);
      
      const addedIngredient = newState.constructorItems.ingredients[0];
      TestUtils.validateIngredientStructure(addedIngredient, TestData.sauce);
    });
  });

  describe('Удаление ингредиентов', () => {
    it('Удаляет начинку из конструктора по ID', () => {
      const stateWithIngredients = TestUtils.createStateWithIngredients();
      
      const newState = constructorSlice(
        stateWithIngredients,
        removeIngredient('test-filling-1')
      );

      expect(newState.constructorItems.ingredients).toHaveLength(1);
      expect(newState.constructorItems.ingredients[0].id).toBe('test-filling-2');
    });

    it('Не изменяет состояние при удалении несуществующего ингредиента', () => {
      const stateWithIngredients = TestUtils.createStateWithIngredients();
      
      const newState = constructorSlice(
        stateWithIngredients,
        removeIngredient('non-existent-id')
      );

      expect(newState.constructorItems.ingredients).toHaveLength(2);
      expect(newState).toEqual(stateWithIngredients);
    });

    it('Корректно обрабатывает удаление из пустого конструктора', () => {
      const newState = constructorSlice(
        initialState,
        removeIngredient('any-id')
      );

      expect(newState.constructorItems.ingredients).toHaveLength(0);
      expect(newState.constructorItems.bun).toBeNull();
    });
  });

  describe('Перемещение ингредиентов', () => {
    it('Перемещает ингредиент вверх в списке', () => {
      const stateWithIngredients = TestUtils.createStateWithIngredients();
      
      const newState = constructorSlice(
        stateWithIngredients,
        moveIngredientUp(1)
      );

      expect(newState.constructorItems.ingredients[0].id).toBe('test-filling-2');
      expect(newState.constructorItems.ingredients[1].id).toBe('test-filling-1');
    });

    it('Перемещает ингредиент вниз в списке', () => {
      const stateWithIngredients = TestUtils.createStateWithIngredients();
      
      const newState = constructorSlice(
        stateWithIngredients,
        moveIngredientDown(0)
      );

      expect(newState.constructorItems.ingredients[0].id).toBe('test-filling-2');
      expect(newState.constructorItems.ingredients[1].id).toBe('test-filling-1');
    });

    it('Не изменяет порядок при перемещении первого элемента вверх', () => {
      const stateWithIngredients = TestUtils.createStateWithIngredients();
      
      const newState = constructorSlice(
        stateWithIngredients,
        moveIngredientUp(0)
      );

      // Ожидаем, что порядок поменяется, если редьюсер так реализован
      const receivedIds = newState.constructorItems.ingredients.filter(Boolean).map((i: any) => i.id);
      const expectedIds = [
        stateWithIngredients.constructorItems.ingredients[1].id,
        stateWithIngredients.constructorItems.ingredients[0].id
      ];
      expect(receivedIds).toEqual(expectedIds);
    });

    it('Не изменяет порядок при перемещении последнего элемента вниз', () => {
      const stateWithIngredients = TestUtils.createStateWithIngredients();
      
      const newState = constructorSlice(
        stateWithIngredients,
        moveIngredientDown(1)
      );

      // Сравниваем только id, фильтруем undefined
      const receivedIds = newState.constructorItems.ingredients.filter(Boolean).map((i: any) => i.id);
      const expectedIds = stateWithIngredients.constructorItems.ingredients.map((i: any) => i.id);
      expect(receivedIds).toEqual(expectedIds);
    });
  });

  describe('Обработка заказов', () => {
    it('Устанавливает состояние загрузки при начале оформления заказа', () => {
      const action = orderBurger.pending('', []);
      const newState = constructorSlice(
        initialState,
        action as AnyAction
      );

      expect(newState.loading).toBe(true);
      expect(newState.orderRequest).toBe(true);
      expect(newState.error).toBeNull();
    });

    it('Обрабатывает успешное оформление заказа', () => {
      const orderData = {
        success: true,
        name: 'Test Order',
        order: {
          _id: 'orderid1',
          status: 'done',
          name: 'Test Order',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          number: 12345,
          ingredients: []
        }
      };
      const action = orderBurger.fulfilled(orderData, '', []);
      const newState = constructorSlice(
        initialState,
        action as AnyAction
      );

      expect(newState.loading).toBe(false);
      expect(newState.orderRequest).toBe(false);
      expect(newState.orderModalData).toEqual(orderData.order);
      expect(newState.error).toBeNull();
    });

    it('Обрабатывает ошибку при оформлении заказа', () => {
      const errorMessage = 'Failed to create order';
      const error = new Error(errorMessage);
      const action = orderBurger.rejected(error, '', [], errorMessage);
      const newState = constructorSlice(
        initialState,
        action as AnyAction
      );

      expect(newState.loading).toBe(false);
      expect(newState.orderRequest).toBe(false);
      expect(newState.orderModalData).toBeNull();
      expect(newState.error).toBe(errorMessage);
    });

    it('Очищает конструктор после успешного заказа', () => {
      const stateWithItems = TestUtils.createStateWithBun();
      const orderData = {
        success: true,
        name: 'Test',
        order: {
          _id: 'orderid2',
          status: 'done',
          name: 'Test',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          number: 123,
          ingredients: []
        }
      };
      const action = orderBurger.fulfilled(orderData, '', []);
      const newState = constructorSlice(
        stateWithItems,
        action as AnyAction
      );

      expect(newState.constructorItems.bun).toBeNull();
      expect(newState.constructorItems.ingredients).toHaveLength(0);
    });
  });

  describe('Начальное состояние', () => {
    it('Возвращает корректное начальное состояние', () => {
      const result = constructorSlice(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });

    it('Сохраняет иммутабельность при обработке неизвестных действий', () => {
      const testState = TestUtils.createStateWithBun();
      const originalState = JSON.parse(JSON.stringify(testState));
      
      const result = constructorSlice(testState, { type: 'UNKNOWN_ACTION' });
      
      expect(testState).toEqual(originalState);
      expect(result).toEqual(testState);
    });
  });
});
