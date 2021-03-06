import _defaultsDeep from 'lodash/defaultsDeep';
import { AnyObject, isObject } from '@lxjx/utils';
import {
  BaseRequestOptions,
  CreateInstance,
  CreateOptions,
  ExtraOptions,
  MixOpt,
  Request,
} from './interfaces';
import { defaultCreateConfig } from './default';
import { CacheBeforePlugin } from './plugins/CacheBeforePlugin';
import { CorePlugin } from './plugins/CorePlugin';
import { CachePlugin } from './plugins/CachePlugin';

const createInstance: CreateInstance = <OPTIONS extends BaseRequestOptions, ExtraExpand = {}>(
  createOptions: CreateOptions<OPTIONS, ExtraExpand>,
) => {
  // 创建时配置
  const cOpt = {
    ...defaultCreateConfig,
    ...createOptions,
    plugins: [CacheBeforePlugin, CorePlugin, ...(createOptions.plugins || []), CachePlugin],
  } as CreateOptions<OPTIONS, ExtraExpand>;

  const { baseOptions } = cOpt;

  const request: Request<OPTIONS, ExtraExpand> = (
    url: string,
    optionsArg?: MixOpt<OPTIONS, ExtraExpand>,
  ) => {
    // 请求时配置
    const options: MixOpt<OPTIONS, ExtraExpand> = _defaultsDeep(
      {
        url,
      },
      optionsArg,
      baseOptions,
      {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
      },
    );

    // 额外配置
    const extra = options.extraOption || ({} as ExtraOptions<ExtraExpand>);

    const ctx: AnyObject = {};

    const format = extra.format || cOpt.format;

    const plugins = cOpt.plugins!.map(Plugin => {
      return new Plugin(ctx, cOpt, options, extra);
    });

    /* ======== before ======= */
    for (const plugin of plugins) {
      const returns = plugin.before?.();

      if (returns) {
        return returns;
      }
    }

    return (
      cOpt.fetchAdapter!(options)
        /* ======== 预处理 ======= */
        .then(async response => {
          // 在此处抹平各种场景请求库的response差异, 当为fetch等请求时，需要从json()方法中拿到data并设置到response中
          // 1. 确保response的data指向服务器返回的对象
          if (!isObject(response.data) && typeof response.json === 'function') {
            response.data = await response.json();
          }
          return response;
        })
        /* ======== pipe ======= */
        .then(response => {
          return plugins.reduce((prev, plugin) => {
            if ('pipe' in plugin) {
              // pipe不存在时直接返回上一个response
              return plugin.pipe ? plugin.pipe(prev) : prev;
            }
            return prev;
          }, response);
        })
        /* ======== success ======= */
        .then(response => {
          plugins.forEach(plugin => {
            plugin.success?.(response);
          });

          let res = response;

          // 格式化返回
          if (format && !extra.plain) {
            res = format(response, extra, options);
          }

          return [null, res];
        })
        /* ======== error ======= */
        .catch(error => {
          plugins.forEach(plugin => {
            plugin.error?.(error);
          });

          return [error, null] as any;
        })
        /* ======== finish ======= */
        .finally(() => {
          plugins.forEach(plugin => {
            plugin.finish?.();
          });
        })
    );
  };

  request.promise = (url, options) =>
    new Promise((resolve, reject) => {
      request(url, options)
        .then(([err, res]) => {
          if (err) {
            reject(err);
            return; // ? 好像不用写
          }
          resolve(res);
        })
        .catch(reject);
    });

  return request;
};

export default createInstance;

export * from './Plugin';
