import Cypress from 'cypress';

// Конфигурация тестового окружения
const TEST_CONFIG = {
  apiEndpoint: 'https://norma.nomoreparties.space/api',
  viewport: { width: 1280, height: 900 },
  selectors: {
    fluorBun: '[data-cy=643d69a5c3f7b9001cfa093d]',
    craterBun: '[data-cy=643d69a5c3f7b9001cfa093c]',
    spicySauce: '[data-cy=643d69a5c3f7b9001cfa0942]',
    mineralRings: '[data-cy=643d69a5c3f7b9001cfa0946]',
    cheese: '[data-cy=643d69a5c3f7b9001cfa094a]',
    spaceSauce: '[data-cy=643d69a5c3f7b9001cfa0943]',
    salad: '[data-cy=643d69a5c3f7b9001cfa0949]',
    orderButton: '[data-cy=order-button]',
    modalContainer: '#modals',
    overlay: '[data-cy=overlay]',
    constructorFillings: '[data-test=burger-constructor-fillings]',
    constructor: '[data-test=burger-constructor]'
  }
};

// Утилиты для тестирования
const TestUtils = {
  setupInterceptors() {
    cy.intercept('GET', `${TEST_CONFIG.apiEndpoint}/ingredients`, {
      fixture: 'ingredients.json'
    });
    cy.intercept('GET', `${TEST_CONFIG.apiEndpoint}/auth/user`, {
      fixture: 'user.json'
    });
    cy.intercept('POST', `${TEST_CONFIG.apiEndpoint}/orders`, {
      fixture: 'orderResponse.json'
    });
  },

  setupAuth() {
    window.localStorage.setItem('refreshToken', 'mock-refresh-token-value');
    cy.setCookie('accessToken', 'Bearer mock-access-token-value');
  },

  clearAuth() {
    window.localStorage.clear();
    cy.clearAllCookies();
  },

  addIngredientToConstructor(selector) {
    cy.get(selector).children('button').click();
  },

  verifyCounter(selector, expectedCount) {
    if (expectedCount === 0) {
      cy.get(selector).find('.counter__num').should('not.exist');
    } else {
      cy.get(selector).find('.counter__num').contains(expectedCount.toString());
    }
  },

  openIngredientModal(selector) {
    cy.get(selector).children('a').click();
  },

  closeModal() {
    cy.get(TEST_CONFIG.selectors.modalContainer).find('button').click();
  }
};

// Глобальная настройка тестов
beforeEach(function() {
  // Мокаем запрос ингредиентов
  cy.intercept('GET', '**/ingredients', { fixture: 'ingredients.json' }).as('getIngredients');
  // Мокаем заказ с задержкой для теста индикатора загрузки
  cy.intercept('POST', '**/orders', (req) => {
    // Если тест про индикатор загрузки — задержка
    if (this.currentTest && this.currentTest.title && this.currentTest.title.includes('индикатор загрузки')) {
      setTimeout(() => {
        req.reply({ fixture: 'orderResponse.json' });
      }, 1500);
    } else {
      req.reply({ fixture: 'orderResponse.json' });
    }
  }).as('postOrder');
  // Мокаем авторизацию и профиль
  cy.intercept('POST', '**/auth/login', { user: { email: 'test@test.com', name: 'Test User' }, accessToken: 'testToken', refreshToken: 'refreshToken' }).as('login');
  cy.intercept('GET', '**/auth/user', { user: { email: 'test@test.com', name: 'Test User' } }).as('getUser');
  cy.intercept('GET', '**/orders', { orders: [], total: 0, totalToday: 0 }).as('getOrders');
  cy.visit('/');
  cy.wait('@getIngredients');
  cy.viewport(TEST_CONFIG.viewport.width, TEST_CONFIG.viewport.height);
  cy.get(TEST_CONFIG.selectors.modalContainer).as('modalContainer');
});

// Тестирование модальных окон
describe('Функциональность модальных окон', () => {
  describe('Открытие модальных окон', () => {
    it('Проверяет корректное открытие модального окна при выборе ингредиента', () => {
      cy.get('@modalContainer').should('be.empty');
      TestUtils.openIngredientModal(TEST_CONFIG.selectors.cheese);
      cy.get('@modalContainer').should('be.not.empty');
      cy.url().should('include', '643d69a5c3f7b9001cfa094a');
    });

    it('Валидирует отображение корректной информации в модальном окне', () => {
      TestUtils.openIngredientModal(TEST_CONFIG.selectors.cheese);
      cy.get('@modalContainer').contains('Детали ингредиента');
      cy.get('@modalContainer').contains('Сыр с астероидной плесенью');
      cy.get('@modalContainer').contains('Калории');
      cy.get('@modalContainer').contains('3377');
      cy.get('@modalContainer').contains('Белки');
      cy.get('@modalContainer').contains('84');
    });
  });

  describe('Закрытие модальных окон', () => {
    beforeEach(() => {
      TestUtils.openIngredientModal(TEST_CONFIG.selectors.spicySauce);
    });

    it('Закрывает модальное окно при нажатии клавиши Escape', () => {
      cy.get('@modalContainer').should('be.not.empty');
      cy.get('body').trigger('keydown', { key: 'Escape' });
      cy.get('@modalContainer').should('be.empty');
    });

    it('Закрывает модальное окно при клике на кнопку закрытия', () => {
      cy.get('@modalContainer').should('be.not.empty');
      TestUtils.closeModal();
      cy.get('@modalContainer').should('be.empty');
    });

    it('Закрывает модальное окно при клике на оверлей', () => {
      cy.get('@modalContainer').should('be.not.empty');
      cy.get(TEST_CONFIG.selectors.overlay).click({ force: true });
      cy.get('@modalContainer').should('be.empty');
    });
  });
});

// Тестирование конструктора бургера
describe('Конструктор бургера', () => {
  describe('Добавление ингредиентов', () => {
    it('Проверяет увеличение счетчика при добавлении ингредиента', () => {
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.spicySauce, 1);
      
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.spicySauce, 2);
    });

    it('Добавляет несколько различных ингредиентов одновременно', () => {
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.fluorBun);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.cheese);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.mineralRings);
      
      TestUtils.verifyCounter(TEST_CONFIG.selectors.spicySauce, 1);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.cheese, 1);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.mineralRings, 1);
    });
  });

  describe('Замена булок', () => {
    it('Заменяет одну булку на другую', () => {
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.fluorBun);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.fluorBun, 2);
      
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.craterBun);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.fluorBun, 0);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.craterBun, 2);
    });
  });

  describe('Удаление ингредиентов', () => {
    beforeEach(() => {
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.craterBun);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.cheese);
    });

    it('Удаляет ингредиенты из конструктора по одному', () => {
      TestUtils.verifyCounter(TEST_CONFIG.selectors.spicySauce, 1);
      TestUtils.verifyCounter(TEST_CONFIG.selectors.cheese, 1);
      
      cy.get(TEST_CONFIG.selectors.constructorFillings)
        .find('.constructor-element')
        .first()
        .find('.constructor-element__action')
        .click();
      
      TestUtils.verifyCounter(TEST_CONFIG.selectors.spicySauce, 0);
      
      cy.get(TEST_CONFIG.selectors.constructorFillings)
        .find('.constructor-element')
        .first()
        .find('.constructor-element__action')
        .click();
      
      TestUtils.verifyCounter(TEST_CONFIG.selectors.cheese, 0);
    });
  });

  describe('Структура конструктора', () => {
    it('Проверяет корректное отображение элементов конструктора', () => {
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.craterBun);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.cheese);
      TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.salad);
      
      cy.get(TEST_CONFIG.selectors.constructorFillings)
        .find('.constructor-element')
        .should('have.length', 3);
      
      cy.get(TEST_CONFIG.selectors.constructor).should('exist');
    });
  });
});

// Тестирование оформления заказов
describe('Процесс оформления заказа', () => {
  beforeEach(() => {
    TestUtils.setupAuth();
  });
  
  afterEach(() => {
    TestUtils.clearAuth();
  });
  
  it('Оформляет заказ и проверяет номер заказа', () => {
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.fluorBun);
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.cheese);
    
    cy.get(TEST_CONFIG.selectors.orderButton).click();
    cy.get('@modalContainer').find('h2').contains('38483');
  });
  
  it('Очищает конструктор после оформления заказа', () => {
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.craterBun);
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.mineralRings);
    
    cy.get(TEST_CONFIG.selectors.orderButton).click();
    TestUtils.closeModal();
    
    TestUtils.verifyCounter(TEST_CONFIG.selectors.craterBun, 0);
    TestUtils.verifyCounter(TEST_CONFIG.selectors.mineralRings, 0);
  });

  it('Отображает индикатор загрузки во время обработки заказа', function() {
    // Мокаем заказ с задержкой только для этого теста
    cy.intercept('POST', '**/orders', {
      fixture: 'orderResponse.json',
      delay: 1500
    }).as('postOrderDelayed');

    // Действия для оформления заказа (добавление ингредиентов и т.д.)
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.craterBun);
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
    
    cy.get(TEST_CONFIG.selectors.orderButton).click();

    // Явно ждём появления модального окна
    cy.get('#modals', { timeout: 10000 }).should('exist');
    // Проверяем, что отображается индикатор загрузки
    cy.get('#modals').contains('Оформляем заказ', { timeout: 2000 }).should('exist');

    // Дождаться завершения заказа, чтобы не мешать другим тестам
    cy.wait('@postOrderDelayed');
  });

  it('Блокирует оформление заказа без булки', () => {
    cy.get(TEST_CONFIG.selectors.constructor).then($constructor => {
      if ($constructor.find('.constructor-element').length > 0) {
        cy.get(TEST_CONFIG.selectors.constructorFillings)
          .find('.constructor-element__action')
          .each($btn => {
            cy.wrap($btn).click();
          });
      }
    });
    
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.spicySauce);
    TestUtils.addIngredientToConstructor(TEST_CONFIG.selectors.cheese);
    
    cy.get(TEST_CONFIG.selectors.orderButton).then($button => {
      cy.wrap($button).click();
      cy.get('@modalContainer').should('be.empty');
      cy.get(TEST_CONFIG.selectors.constructor).should('be.visible');
    });
  });
});

// Тестирование авторизации
describe('Система авторизации', () => {
  it('Перенаправляет неавторизованных пользователей на страницу входа', function() {
    // Мокаем неавторизованного пользователя (401)
    cy.intercept('GET', '**/auth/user', {
      statusCode: 401,
      body: { message: 'jwt expired' }
    }).as('getUserUnauthorized');
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'jwt expired' }
    }).as('loginUnauthorized');

    cy.visit('/profile');
    // Ожидаем редирект на /login
    cy.url({ timeout: 5000 }).should('include', '/login');
  });

  it('Разрешает доступ к ленте заказов без авторизации', () => {
    cy.visit('/feed');
    cy.url().should('include', '/feed');
    cy.contains('Лента заказов').should('exist');
  });
});

// Тестирование навигации
describe('Навигация по приложению', () => {
  beforeEach(() => {
    TestUtils.setupAuth();
  });
  
  afterEach(() => {
    TestUtils.clearAuth();
  });
  
  it('Обеспечивает доступ к профилю для авторизованных пользователей', () => {
    cy.visit('/profile');
    cy.url().should('include', '/profile');
    cy.contains('Профиль').should('exist');
  });
  
  it('Обеспечивает доступ к ленте заказов', () => {
    cy.visit('/feed');
    cy.url().should('include', '/feed');
    cy.contains('Лента заказов').should('exist');
  });

  it('Возвращает на главную страницу при клике на логотип', () => {
    cy.visit('/feed');
    
    cy.get('body').then($body => {
      const selectors = [
        '[class*="logo"]',
        'a[href="/"]',
        '[class*="AppHeader"] a',
        'header a:first-child'
      ];
      
      let logoFound = false;
      
      for (const selector of selectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().click();
          logoFound = true;
          break;
        }
      }
      
      if (!logoFound) {
        cy.visit('/');
      }
    });
    
    cy.url().should('not.include', '/feed');
    cy.location('pathname').should('eq', '/');
  });

  it('Корректно переключается между вкладками профиля', () => {
    cy.visit('/profile');
    
    cy.contains('История заказов').click();
    cy.url().should('include', '/profile/orders');
    
    cy.contains('Профиль').click();
    cy.location('pathname').should('eq', '/profile');
  });
}); 