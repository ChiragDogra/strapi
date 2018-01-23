'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const Grant = require('grant-koa');

module.exports = strapi => {
  return {
    beforeInitialize: function() {
      strapi.config.middleware.load.after.push('provider');
    },

    initialize: function(cb) {
      const grantConfig = Object.assign(_.clone(_.get(strapi.plugins['users-permissions'].config, 'grant', {})), {
        server: {
          protocol: 'http',
          host: 'localhost:1337'
        }
      });

      const grant = new Grant(grantConfig);

      strapi.app.use(async (ctx, next) => {
        if (_.startsWith(ctx.request.url, '/connect') && ctx.request.method === 'GET') {
          const provider = _.last(ctx.request.url.split('/'));
          const config = strapi.plugins['users-permissions'].config.grant[provider];

          if (_.get(config, 'enabled')) {
            await next();
          } else {
            return ctx.badRequest(null, 'This provider is disabled.');
          }
        } else {
          await next();
        }
      });

      strapi.app.use(strapi.koaMiddlewares.compose(grant.middleware));

      cb();
    }
  };
};
