import assert from 'node:assert';

import { getAllRoutes } from '../../main/index.js';
import { HelloRouter } from '../routers/HelloRouter.js';
import { InheritedRouter } from '../routers/InheritedRouter.js';

describe('decorators', () => {

    it('defines routes and middlewares', () => {
        const allRoutes = getAllRoutes(HelloRouter);
        assert.strictEqual(allRoutes.length, 3);
        assert.strictEqual(allRoutes[0].role, 'middleware');
        assert.strictEqual(allRoutes[0].method, '*');
        assert.strictEqual(allRoutes[0].summary, 'Hello middleware');
        assert.strictEqual(allRoutes[1].role, 'endpoint');
        assert.strictEqual(allRoutes[1].method, 'GET');
        assert.strictEqual(allRoutes[1].path, '/hello');
        assert.strictEqual(allRoutes[1].summary, '');
        assert.strictEqual(allRoutes[2].role, 'endpoint');
        assert.strictEqual(allRoutes[2].method, 'POST');
        assert.strictEqual(allRoutes[2].path, '/hello');
    });

    it('registers inherited routes and middlewares in correct order', () => {
        const allRoutes = getAllRoutes(InheritedRouter);
        assert.strictEqual(allRoutes.length, 4);
        assert.strictEqual(allRoutes[0].role, 'middleware');
        assert.strictEqual(allRoutes[0].method, '*');
        assert.strictEqual(allRoutes[0].summary, 'Base middleware');
        assert.strictEqual(allRoutes[1].role, 'endpoint');
        assert.strictEqual(allRoutes[1].method, 'GET');
        assert.strictEqual(allRoutes[1].path, '/base');
        assert.strictEqual(allRoutes[2].role, 'middleware');
        assert.strictEqual(allRoutes[2].method, '*');
        assert.strictEqual(allRoutes[2].summary, 'Inherited middleware');
        assert.strictEqual(allRoutes[3].role, 'endpoint');
        assert.strictEqual(allRoutes[3].method, 'GET');
        assert.strictEqual(allRoutes[3].path, '/inherited');
    });

    it('registers parameters', () => {
        const createRoute = getAllRoutes(HelloRouter)
            .find(r => r.method === 'POST' && r.path === '/hello');
        if (!createRoute) {
            assert.fail('Create route not found');
        }
        assert.strictEqual(createRoute.params.length, 2);
        assert.strictEqual(createRoute.params[0].name, 'name');
        assert.strictEqual(createRoute.params[0].source, 'body');
        assert.strictEqual(createRoute.params[0].index, 0);
        assert.strictEqual(createRoute.params[0].schema.schema.type, 'string');
        assert.strictEqual(createRoute.params[0].required, true);
        assert.strictEqual(createRoute.params[1].name, 'age');
        assert.strictEqual(createRoute.params[1].source, 'query');
        assert.strictEqual(createRoute.params[1].index, 1);
        assert.strictEqual(createRoute.params[1].schema.schema.type, 'number');
        assert.strictEqual(createRoute.params[1].required, false);
    });

});
