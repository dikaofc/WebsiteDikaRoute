// ============================================================================
//  DikaRoute — AI Agent Visibility Worker
//  Target: https://api.obitoglory.tech
//
//  Serves DikaRoute documentation as machine-readable surfaces for AI agents:
//    GET  /llms.txt            - concise markdown index
//    GET  /llms-full.txt       - full concatenated content
//    GET  /index.json          - typed JSON index (agent-visibility/0.1)
//    GET  /robots.txt          - AI-agent-friendly robots directives
//    GET  /jsonld              - WebSite JSON-LD
//    GET  /:slug.md            - single resource as markdown
//    GET  /:slug.jsonld        - single resource as JSON-LD (Article)
//    GET  /api/site            - site info + available surfaces
//    GET  /api/resources       - list resources (enriched)
//    GET  /api/resources/:slug - single resource (enriched)
//    POST /api/resources       - add/update a resource (Bearer ADMIN_TOKEN)
//    POST /api/refresh         - full reset to bundled docs baseline (Bearer ADMIN_TOKEN)
//    GET  /.well-known/web-bot-auth/directory  (needs ENABLE_WEB_BOT_AUTH=true)
//    ALL  /api/identity        - Web Bot Auth verification (RFC 9421, Ed25519)
//
//  Required bindings (Workers > Settings > Variables & Bindings):
//    KV namespace   : VISIBILITY_CACHE  (create one, e.g. "visibility-cache")
//    Workers AI     : AI                (the AI binding)
//    Variable       : AI_MODEL          e.g. "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
//    Secret         : ADMIN_TOKEN       e.g. a long random string
//  Optional variables:
//    SITE_NAME, SITE_DESCRIPTION, ENRICHMENT_CACHE_TTL (default 3600),
//    CONTENT_SIGNAL, ENABLE_WEB_BOT_AUTH ("true" to enable web-bot-auth)
// ============================================================================
var compose = (middleware, onError, onNotFound) => {
    return (context, next) => {
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
            if (i <= index) {
                throw new Error("next() called multiple times");
            }
            index = i;
            let res;
            let isError = false;
            let handler;
            if (middleware[i]) {
                handler = middleware[i][0][0];
                context.req.routeIndex = i;
            } else {
                handler = i === middleware.length && next || void 0;
            }
            if (handler) {
                try {
                    res = await handler(context, () => dispatch(i + 1));
                } catch (err) {
                    if (err instanceof Error && onError) {
                        context.error = err;
                        res = await onError(err, context);
                        isError = true;
                    } else {
                        throw err;
                    }
                }
            } else {
                if (context.finalized === false && onNotFound) {
                    res = await onNotFound(context);
                }
            }
            if (res && (context.finalized === false || isError)) {
                context.res = res;
            }
            return context;
        }
    };
};
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
    const { all = false, dot = false } = options;
    const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
    const contentType = headers.get("Content-Type");
    if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
        return parseFormData(request, { all, dot });
    }
    return {};
};
async function parseFormData(request, options) {
    const formData = await request.formData();
    if (formData) {
        return convertFormDataToBodyData(formData, options);
    }
    return {};
}
function convertFormDataToBodyData(formData, options) {
    const form = /* @__PURE__ */ Object.create(null);
    formData.forEach((value, key) => {
        const shouldParseAllValues = options.all || key.endsWith("[]");
        if (!shouldParseAllValues) {
            form[key] = value;
        } else {
            handleParsingAllValues(form, key, value);
        }
    });
    if (options.dot) {
        Object.entries(form).forEach(([key, value]) => {
            const shouldParseDotValues = key.includes(".");
            if (shouldParseDotValues) {
                handleParsingNestedValues(form, key, value);
                delete form[key];
            }
        });
    }
    return form;
}
var handleParsingAllValues = (form, key, value) => {
    if (form[key] !== void 0) {
        if (Array.isArray(form[key])) {
            form[key].push(value);
        } else {
            form[key] = [form[key], value];
        }
    } else {
        if (!key.endsWith("[]")) {
            form[key] = value;
        } else {
            form[key] = [value];
        }
    }
};
var handleParsingNestedValues = (form, key, value) => {
    let nestedForm = form;
    const keys = key.split(".");
    keys.forEach((key2, index) => {
        if (index === keys.length - 1) {
            nestedForm[key2] = value;
        } else {
            if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
                nestedForm[key2] = /* @__PURE__ */ Object.create(null);
            }
            nestedForm = nestedForm[key2];
        }
    });
};
var splitPath = (path) => {
    const paths = path.split("/");
    if (paths[0] === "") {
        paths.shift();
    }
    return paths;
};
var splitRoutingPath = (routePath) => {
    const { groups, path } = extractGroupsFromPath(routePath);
    const paths = splitPath(path);
    return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
    const groups = [];
    path = path.replace(/\{[^}]+\}/g, (match2, index) => {
        const mark = `@${index}`;
        groups.push([mark, match2]);
        return mark;
    });
    return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
    for (let i = groups.length - 1; i >= 0; i--) {
        const [mark] = groups[i];
        for (let j = paths.length - 1; j >= 0; j--) {
            if (paths[j].includes(mark)) {
                paths[j] = paths[j].replace(mark, groups[i][1]);
                break;
            }
        }
    }
    return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
    if (label === "*") {
        return "*";
    }
    const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    if (match2) {
        const cacheKey = `${label}#${next}`;
        if (!patternCache[cacheKey]) {
            if (match2[2]) {
                patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
            } else {
                patternCache[cacheKey] = [label, match2[1], true];
            }
        }
        return patternCache[cacheKey];
    }
    return null;
};
var tryDecode = (str, decoder) => {
    try {
        return decoder(str);
    } catch {
        return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
            try {
                return decoder(match2);
            } catch {
                return match2;
            }
        });
    }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
    const url = request.url;
    const start = url.indexOf("/", url.indexOf(":") + 4);
    let i = start;
    for (; i < url.length; i++) {
        const charCode = url.charCodeAt(i);
        if (charCode === 37) {
            const queryIndex = url.indexOf("?", i);
            const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
            return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
        } else if (charCode === 63) {
            break;
        }
    }
    return url.slice(start, i);
};
var getPathNoStrict = (request) => {
    const result = getPath(request);
    return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
    if (rest.length) {
        sub = mergePath(sub, ...rest);
    }
    return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
    if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
        return null;
    }
    const segments = path.split("/");
    const results = [];
    let basePath = "";
    segments.forEach((segment) => {
        if (segment !== "" && !/\:/.test(segment)) {
            basePath += "/" + segment;
        } else if (/\:/.test(segment)) {
            if (/\?/.test(segment)) {
                if (results.length === 0 && basePath === "") {
                    results.push("/");
                } else {
                    results.push(basePath);
                }
                const optionalSegment = segment.replace("?", "");
                basePath += "/" + optionalSegment;
                results.push(basePath);
            } else {
                basePath += "/" + segment;
            }
        }
    });
    return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
    if (!/[%+]/.test(value)) {
        return value;
    }
    if (value.indexOf("+") !== -1) {
        value = value.replace(/\+/g, " ");
    }
    return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
    let encoded;
    if (!multiple && key && !/[%+]/.test(key)) {
        let keyIndex2 = url.indexOf("?", 8);
        if (keyIndex2 === -1) {
            return void 0;
        }
        if (!url.startsWith(key, keyIndex2 + 1)) {
            keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        while (keyIndex2 !== -1) {
            const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
            if (trailingKeyCode === 61) {
                const valueIndex = keyIndex2 + key.length + 2;
                const endIndex = url.indexOf("&", valueIndex);
                return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
            } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
                return "";
            }
            keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url);
        if (!encoded) {
            return void 0;
        }
    }
    const results = {};
    encoded ??= /[%+]/.test(url);
    let keyIndex = url.indexOf("?", 8);
    while (keyIndex !== -1) {
        const nextKeyIndex = url.indexOf("&", keyIndex + 1);
        let valueIndex = url.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
            valueIndex = -1;
        }
        let name = url.slice(
            keyIndex + 1,
            valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
        );
        if (encoded) {
            name = _decodeURI(name);
        }
        keyIndex = nextKeyIndex;
        if (name === "") {
            continue;
        }
        let value;
        if (valueIndex === -1) {
            value = "";
        } else {
            value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
            if (encoded) {
                value = _decodeURI(value);
            }
        }
        if (multiple) {
            if (!(results[name] && Array.isArray(results[name]))) {
                results[name] = [];
            }
            results[name].push(value);
        } else {
            results[name] ??= value;
        }
    }
    return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
    return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
    /**
     * `.raw` can get the raw Request object.
     *
     * @see {@link https://hono.dev/docs/api/request#raw}
     *
     * @example
     * ```ts
     * // For Cloudflare Workers
     * app.post('/', async (c) => {
     *   const metadata = c.req.raw.cf?.hostMetadata?
     *   ...
     * })
     * ```
     */
    raw;
    #validatedData;
    // Short name of validatedData
    #matchResult;
    routeIndex = 0;
    /**
     * `.path` can get the pathname of the request.
     *
     * @see {@link https://hono.dev/docs/api/request#path}
     *
     * @example
     * ```ts
     * app.get('/about/me', (c) => {
     *   const pathname = c.req.path // `/about/me`
     * })
     * ```
     */
    path;
    bodyCache = {};
    constructor(request, path = "/", matchResult = [[]]) {
        this.raw = request;
        this.path = path;
        this.#matchResult = matchResult;
        this.#validatedData = {};
    }
    param(key) {
        return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
    }
    #getDecodedParam(key) {
        const paramKey = this.#matchResult[0][this.routeIndex][1][key];
        const param = this.#getParamValue(paramKey);
        return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
    }
    #getAllDecodedParams() {
        const decoded = {};
        const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
        for (const key of keys) {
            const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
            if (value !== void 0) {
                decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
            }
        }
        return decoded;
    }
    #getParamValue(paramKey) {
        return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
    }
    query(key) {
        return getQueryParam(this.url, key);
    }
    queries(key) {
        return getQueryParams(this.url, key);
    }
    header(name) {
        if (name) {
            return this.raw.headers.get(name) ?? void 0;
        }
        const headerData = {};
        this.raw.headers.forEach((value, key) => {
            headerData[key] = value;
        });
        return headerData;
    }
    async parseBody(options) {
        return this.bodyCache.parsedBody ??= await parseBody(this, options);
    }
    #cachedBody = (key) => {
        const { bodyCache, raw } = this;
        const cachedBody = bodyCache[key];
        if (cachedBody) {
            return cachedBody;
        }
        const anyCachedKey = Object.keys(bodyCache)[0];
        if (anyCachedKey) {
            return bodyCache[anyCachedKey].then((body) => {
                if (anyCachedKey === "json") {
                    body = JSON.stringify(body);
                }
                return new Response(body)[key]();
            });
        }
        return bodyCache[key] = raw[key]();
    };
    /**
     * `.json()` can parse Request body of type `application/json`
     *
     * @see {@link https://hono.dev/docs/api/request#json}
     *
     * @example
     * ```ts
     * app.post('/entry', async (c) => {
     *   const body = await c.req.json()
     * })
     * ```
     */
    json() {
        return this.#cachedBody("text").then((text) => JSON.parse(text));
    }
    /**
     * `.text()` can parse Request body of type `text/plain`
     *
     * @see {@link https://hono.dev/docs/api/request#text}
     *
     * @example
     * ```ts
     * app.post('/entry', async (c) => {
     *   const body = await c.req.text()
     * })
     * ```
     */
    text() {
        return this.#cachedBody("text");
    }
    /**
     * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
     *
     * @see {@link https://hono.dev/docs/api/request#arraybuffer}
     *
     * @example
     * ```ts
     * app.post('/entry', async (c) => {
     *   const body = await c.req.arrayBuffer()
     * })
     * ```
     */
    arrayBuffer() {
        return this.#cachedBody("arrayBuffer");
    }
    /**
     * Parses the request body as a `Blob`.
     * @example
     * ```ts
     * app.post('/entry', async (c) => {
     *   const body = await c.req.blob();
     * });
     * ```
     * @see https://hono.dev/docs/api/request#blob
     */
    blob() {
        return this.#cachedBody("blob");
    }
    /**
     * Parses the request body as `FormData`.
     * @example
     * ```ts
     * app.post('/entry', async (c) => {
     *   const body = await c.req.formData();
     * });
     * ```
     * @see https://hono.dev/docs/api/request#formdata
     */
    formData() {
        return this.#cachedBody("formData");
    }
    /**
     * Adds validated data to the request.
     *
     * @param target - The target of the validation.
     * @param data - The validated data to add.
     */
    addValidatedData(target, data) {
        this.#validatedData[target] = data;
    }
    valid(target) {
        return this.#validatedData[target];
    }
    /**
     * `.url()` can get the request url strings.
     *
     * @see {@link https://hono.dev/docs/api/request#url}
     *
     * @example
     * ```ts
     * app.get('/about/me', (c) => {
     *   const url = c.req.url // `http://localhost:8787/about/me`
     *   ...
     * })
     * ```
     */
    get url() {
        return this.raw.url;
    }
    /**
     * `.method()` can get the method name of the request.
     *
     * @see {@link https://hono.dev/docs/api/request#method}
     *
     * @example
     * ```ts
     * app.get('/about/me', (c) => {
     *   const method = c.req.method // `GET`
     * })
     * ```
     */
    get method() {
        return this.raw.method;
    }
    get [GET_MATCH_RESULT]() {
        return this.#matchResult;
    }
    /**
     * `.matchedRoutes()` can return a matched route in the handler
     *
     * @deprecated
     *
     * Use matchedRoutes helper defined in "hono/route" instead.
     *
     * @see {@link https://hono.dev/docs/api/request#matchedroutes}
     *
     * @example
     * ```ts
     * app.use('*', async function logger(c, next) {
     *   await next()
     *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
     *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
     *     console.log(
     *       method,
     *       ' ',
     *       path,
     *       ' '.repeat(Math.max(10 - path.length, 0)),
     *       name,
     *       i === c.req.routeIndex ? '<- respond from here' : ''
     *     )
     *   })
     * })
     * ```
     */
    get matchedRoutes() {
        return this.#matchResult[0].map(([[, route]]) => route);
    }
    /**
     * `routePath()` can retrieve the path registered within the handler
     *
     * @deprecated
     *
     * Use routePath helper defined in "hono/route" instead.
     *
     * @see {@link https://hono.dev/docs/api/request#routepath}
     *
     * @example
     * ```ts
     * app.get('/posts/:id', (c) => {
     *   return c.json({ path: c.req.routePath })
     * })
     * ```
     */
    get routePath() {
        return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
    }
};
var HtmlEscapedCallbackPhase = {
    Stringify: 1
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
    if (typeof str === "object" && !(str instanceof String)) {
        if (!(str instanceof Promise)) {
            str = str.toString();
        }
        if (str instanceof Promise) {
            str = await str;
        }
    }
    const callbacks = str.callbacks;
    if (!callbacks?.length) {
        return Promise.resolve(str);
    }
    if (buffer) {
        buffer[0] += str;
    } else {
        buffer = [str];
    }
    const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
        (res) => Promise.all(
            res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
        ).then(() => buffer[0])
    );
    {
        return resStr;
    }
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
    return {
        "Content-Type": contentType,
        ...headers
    };
};
var Context = class {
    #rawRequest;
    #req;
    /**
     * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
     *
     * @see {@link https://hono.dev/docs/api/context#env}
     *
     * @example
     * ```ts
     * // Environment object for Cloudflare Workers
     * app.get('*', async c => {
     *   const counter = c.env.COUNTER
     * })
     * ```
     */
    env = {};
    #var;
    finalized = false;
    /**
     * `.error` can get the error object from the middleware if the Handler throws an error.
     *
     * @see {@link https://hono.dev/docs/api/context#error}
     *
     * @example
     * ```ts
     * app.use('*', async (c, next) => {
     *   await next()
     *   if (c.error) {
     *     // do something...
     *   }
     * })
     * ```
     */
    error;
    #status;
    #executionCtx;
    #res;
    #layout;
    #renderer;
    #notFoundHandler;
    #preparedHeaders;
    #matchResult;
    #path;
    /**
     * Creates an instance of the Context class.
     *
     * @param req - The Request object.
     * @param options - Optional configuration options for the context.
     */
    constructor(req, options) {
        this.#rawRequest = req;
        if (options) {
            this.#executionCtx = options.executionCtx;
            this.env = options.env;
            this.#notFoundHandler = options.notFoundHandler;
            this.#path = options.path;
            this.#matchResult = options.matchResult;
        }
    }
    /**
     * `.req` is the instance of {@link HonoRequest}.
     */
    get req() {
        this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
        return this.#req;
    }
    /**
     * @see {@link https://hono.dev/docs/api/context#event}
     * The FetchEvent associated with the current request.
     *
     * @throws Will throw an error if the context does not have a FetchEvent.
     */
    get event() {
        if (this.#executionCtx && "respondWith" in this.#executionCtx) {
            return this.#executionCtx;
        } else {
            throw Error("This context has no FetchEvent");
        }
    }
    /**
     * @see {@link https://hono.dev/docs/api/context#executionctx}
     * The ExecutionContext associated with the current request.
     *
     * @throws Will throw an error if the context does not have an ExecutionContext.
     */
    get executionCtx() {
        if (this.#executionCtx) {
            return this.#executionCtx;
        } else {
            throw Error("This context has no ExecutionContext");
        }
    }
    /**
     * @see {@link https://hono.dev/docs/api/context#res}
     * The Response object for the current request.
     */
    get res() {
        return this.#res ||= new Response(null, {
            headers: this.#preparedHeaders ??= new Headers()
        });
    }
    /**
     * Sets the Response object for the current request.
     *
     * @param _res - The Response object to set.
     */
    set res(_res) {
        if (this.#res && _res) {
            _res = new Response(_res.body, _res);
            for (const [k, v] of this.#res.headers.entries()) {
                if (k === "content-type") {
                    continue;
                }
                if (k === "set-cookie") {
                    const cookies = this.#res.headers.getSetCookie();
                    _res.headers.delete("set-cookie");
                    for (const cookie of cookies) {
                        _res.headers.append("set-cookie", cookie);
                    }
                } else {
                    _res.headers.set(k, v);
                }
            }
        }
        this.#res = _res;
        this.finalized = true;
    }
    /**
     * `.render()` can create a response within a layout.
     *
     * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
     *
     * @example
     * ```ts
     * app.get('/', (c) => {
     *   return c.render('Hello!')
     * })
     * ```
     */
    render = (...args) => {
        this.#renderer ??= (content) => this.html(content);
        return this.#renderer(...args);
    };
    /**
     * Sets the layout for the response.
     *
     * @param layout - The layout to set.
     * @returns The layout function.
     */
    setLayout = (layout) => this.#layout = layout;
    /**
     * Gets the current layout for the response.
     *
     * @returns The current layout function.
     */
    getLayout = () => this.#layout;
    /**
     * `.setRenderer()` can set the layout in the custom middleware.
     *
     * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
     *
     * @example
     * ```tsx
     * app.use('*', async (c, next) => {
     *   c.setRenderer((content) => {
     *     return c.html(
     *       <html>
     *         <body>
     *           <p>{content}</p>
     *         </body>
     *       </html>
     *     )
     *   })
     *   await next()
     * })
     * ```
     */
    setRenderer = (renderer) => {
        this.#renderer = renderer;
    };
    /**
     * `.header()` can set headers.
     *
     * @see {@link https://hono.dev/docs/api/context#header}
     *
     * @example
     * ```ts
     * app.get('/welcome', (c) => {
     *   // Set headers
     *   c.header('X-Message', 'Hello!')
     *   c.header('Content-Type', 'text/plain')
     *
     *   return c.body('Thank you for coming')
     * })
     * ```
     */
    header = (name, value, options) => {
        if (this.finalized) {
            this.#res = new Response(this.#res.body, this.#res);
        }
        const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
        if (value === void 0) {
            headers.delete(name);
        } else if (options?.append) {
            headers.append(name, value);
        } else {
            headers.set(name, value);
        }
    };
    status = (status) => {
        this.#status = status;
    };
    /**
     * `.set()` can set the value specified by the key.
     *
     * @see {@link https://hono.dev/docs/api/context#set-get}
     *
     * @example
     * ```ts
     * app.use('*', async (c, next) => {
     *   c.set('message', 'Hono is hot!!')
     *   await next()
     * })
     * ```
     */
    set = (key, value) => {
        this.#var ??= /* @__PURE__ */ new Map();
        this.#var.set(key, value);
    };
    /**
     * `.get()` can use the value specified by the key.
     *
     * @see {@link https://hono.dev/docs/api/context#set-get}
     *
     * @example
     * ```ts
     * app.get('/', (c) => {
     *   const message = c.get('message')
     *   return c.text(`The message is "${message}"`)
     * })
     * ```
     */
    get = (key) => {
        return this.#var ? this.#var.get(key) : void 0;
    };
    /**
     * `.var` can access the value of a variable.
     *
     * @see {@link https://hono.dev/docs/api/context#var}
     *
     * @example
     * ```ts
     * const result = c.var.client.oneMethod()
     * ```
     */
    // c.var.propName is a read-only
    get var() {
        if (!this.#var) {
            return {};
        }
        return Object.fromEntries(this.#var);
    }
    #newResponse(data, arg, headers) {
        const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
        if (typeof arg === "object" && "headers" in arg) {
            const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
            for (const [key, value] of argHeaders) {
                if (key.toLowerCase() === "set-cookie") {
                    responseHeaders.append(key, value);
                } else {
                    responseHeaders.set(key, value);
                }
            }
        }
        if (headers) {
            for (const [k, v] of Object.entries(headers)) {
                if (typeof v === "string") {
                    responseHeaders.set(k, v);
                } else {
                    responseHeaders.delete(k);
                    for (const v2 of v) {
                        responseHeaders.append(k, v2);
                    }
                }
            }
        }
        const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
        return new Response(data, { status, headers: responseHeaders });
    }
    newResponse = (...args) => this.#newResponse(...args);
    /**
     * `.body()` can return the HTTP response.
     * You can set headers with `.header()` and set HTTP status code with `.status`.
     * This can also be set in `.text()`, `.json()` and so on.
     *
     * @see {@link https://hono.dev/docs/api/context#body}
     *
     * @example
     * ```ts
     * app.get('/welcome', (c) => {
     *   // Set headers
     *   c.header('X-Message', 'Hello!')
     *   c.header('Content-Type', 'text/plain')
     *   // Set HTTP status code
     *   c.status(201)
     *
     *   // Return the response body
     *   return c.body('Thank you for coming')
     * })
     * ```
     */
    body = (data, arg, headers) => this.#newResponse(data, arg, headers);
    /**
     * `.text()` can render text as `Content-Type:text/plain`.
     *
     * @see {@link https://hono.dev/docs/api/context#text}
     *
     * @example
     * ```ts
     * app.get('/say', (c) => {
     *   return c.text('Hello!')
     * })
     * ```
     */
    text = (text, arg, headers) => {
        return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
            text,
            arg,
            setDefaultContentType(TEXT_PLAIN, headers)
        );
    };
    /**
     * `.json()` can render JSON as `Content-Type:application/json`.
     *
     * @see {@link https://hono.dev/docs/api/context#json}
     *
     * @example
     * ```ts
     * app.get('/api', (c) => {
     *   return c.json({ message: 'Hello!' })
     * })
     * ```
     */
    json = (object, arg, headers) => {
        return this.#newResponse(
            JSON.stringify(object),
            arg,
            setDefaultContentType("application/json", headers)
        );
    };
    html = (html, arg, headers) => {
        const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
        return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
    };
    /**
     * `.redirect()` can Redirect, default status code is 302.
     *
     * @see {@link https://hono.dev/docs/api/context#redirect}
     *
     * @example
     * ```ts
     * app.get('/redirect', (c) => {
     *   return c.redirect('/')
     * })
     * app.get('/redirect-permanently', (c) => {
     *   return c.redirect('/', 301)
     * })
     * ```
     */
    redirect = (location, status) => {
        const locationString = String(location);
        this.header(
            "Location",
            // Multibyes should be encoded
            // eslint-disable-next-line no-control-regex
            !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
        );
        return this.newResponse(null, status ?? 302);
    };
    /**
     * `.notFound()` can return the Not Found Response.
     *
     * @see {@link https://hono.dev/docs/api/context#notfound}
     *
     * @example
     * ```ts
     * app.get('/notfound', (c) => {
     *   return c.notFound()
     * })
     * ```
     */
    notFound = () => {
        this.#notFoundHandler ??= () => new Response();
        return this.#notFoundHandler(this);
    };
};
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = (c) => {
    return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
    if ("getResponse" in err) {
        const res = err.getResponse();
        return c.newResponse(res.body, res);
    }
    console.error(err);
    return c.text("Internal Server Error", 500);
};
var Hono$1 = class _Hono {
    get;
    post;
    put;
    delete;
    options;
    patch;
    all;
    on;
    use;
    /*
      This class is like an abstract class and does not have a router.
      To use it, inherit the class and implement router in the constructor.
    */
    router;
    getPath;
    // Cannot use `#` because it requires visibility at JavaScript runtime.
    _basePath = "/";
    #path = "/";
    routes = [];
    constructor(options = {}) {
        const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
        allMethods.forEach((method) => {
            this[method] = (args1, ...args) => {
                if (typeof args1 === "string") {
                    this.#path = args1;
                } else {
                    this.#addRoute(method, this.#path, args1);
                }
                args.forEach((handler) => {
                    this.#addRoute(method, this.#path, handler);
                });
                return this;
            };
        });
        this.on = (method, path, ...handlers) => {
            for (const p of [path].flat()) {
                this.#path = p;
                for (const m of [method].flat()) {
                    handlers.map((handler) => {
                        this.#addRoute(m.toUpperCase(), this.#path, handler);
                    });
                }
            }
            return this;
        };
        this.use = (arg1, ...handlers) => {
            if (typeof arg1 === "string") {
                this.#path = arg1;
            } else {
                this.#path = "*";
                handlers.unshift(arg1);
            }
            handlers.forEach((handler) => {
                this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
            });
            return this;
        };
        const { strict, ...optionsWithoutStrict } = options;
        Object.assign(this, optionsWithoutStrict);
        this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
    }
    #clone() {
        const clone = new _Hono({
            router: this.router,
            getPath: this.getPath
        });
        clone.errorHandler = this.errorHandler;
        clone.#notFoundHandler = this.#notFoundHandler;
        clone.routes = this.routes;
        return clone;
    }
    #notFoundHandler = notFoundHandler;
    // Cannot use `#` because it requires visibility at JavaScript runtime.
    errorHandler = errorHandler;
    /**
     * `.route()` allows grouping other Hono instance in routes.
     *
     * @see {@link https://hono.dev/docs/api/routing#grouping}
     *
     * @param {string} path - base Path
     * @param {Hono} app - other Hono instance
     * @returns {Hono} routed Hono instance
     *
     * @example
     * ```ts
     * const app = new Hono()
     * const app2 = new Hono()
     *
     * app2.get("/user", (c) => c.text("user"))
     * app.route("/api", app2) // GET /api/user
     * ```
     */
    route(path, app2) {
        const subApp = this.basePath(path);
        app2.routes.map((r) => {
            let handler;
            if (app2.errorHandler === errorHandler) {
                handler = r.handler;
            } else {
                handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
                handler[COMPOSED_HANDLER] = r.handler;
            }
            subApp.#addRoute(r.method, r.path, handler);
        });
        return this;
    }
    /**
     * `.basePath()` allows base paths to be specified.
     *
     * @see {@link https://hono.dev/docs/api/routing#base-path}
     *
     * @param {string} path - base Path
     * @returns {Hono} changed Hono instance
     *
     * @example
     * ```ts
     * const api = new Hono().basePath('/api')
     * ```
     */
    basePath(path) {
        const subApp = this.#clone();
        subApp._basePath = mergePath(this._basePath, path);
        return subApp;
    }
    /**
     * `.onError()` handles an error and returns a customized Response.
     *
     * @see {@link https://hono.dev/docs/api/hono#error-handling}
     *
     * @param {ErrorHandler} handler - request Handler for error
     * @returns {Hono} changed Hono instance
     *
     * @example
     * ```ts
     * app.onError((err, c) => {
     *   console.error(`${err}`)
     *   return c.text('Custom Error Message', 500)
     * })
     * ```
     */
    onError = (handler) => {
        this.errorHandler = handler;
        return this;
    };
    /**
     * `.notFound()` allows you to customize a Not Found Response.
     *
     * @see {@link https://hono.dev/docs/api/hono#not-found}
     *
     * @param {NotFoundHandler} handler - request handler for not-found
     * @returns {Hono} changed Hono instance
     *
     * @example
     * ```ts
     * app.notFound((c) => {
     *   return c.text('Custom 404 Message', 404)
     * })
     * ```
     */
    notFound = (handler) => {
        this.#notFoundHandler = handler;
        return this;
    };
    /**
     * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
     *
     * @see {@link https://hono.dev/docs/api/hono#mount}
     *
     * @param {string} path - base Path
     * @param {Function} applicationHandler - other Request Handler
     * @param {MountOptions} [options] - options of `.mount()`
     * @returns {Hono} mounted Hono instance
     *
     * @example
     * ```ts
     * import { Router as IttyRouter } from 'itty-router'
     * import { Hono } from 'hono'
     * // Create itty-router application
     * const ittyRouter = IttyRouter()
     * // GET /itty-router/hello
     * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
     *
     * const app = new Hono()
     * app.mount('/itty-router', ittyRouter.handle)
     * ```
     *
     * @example
     * ```ts
     * const app = new Hono()
     * // Send the request to another application without modification.
     * app.mount('/app', anotherApp, {
     *   replaceRequest: (req) => req,
     * })
     * ```
     */
    mount(path, applicationHandler, options) {
        let replaceRequest;
        let optionHandler;
        if (options) {
            if (typeof options === "function") {
                optionHandler = options;
            } else {
                optionHandler = options.optionHandler;
                if (options.replaceRequest === false) {
                    replaceRequest = (request) => request;
                } else {
                    replaceRequest = options.replaceRequest;
                }
            }
        }
        const getOptions = optionHandler ? (c) => {
            const options2 = optionHandler(c);
            return Array.isArray(options2) ? options2 : [options2];
        } : (c) => {
            let executionContext = void 0;
            try {
                executionContext = c.executionCtx;
            } catch {
            }
            return [c.env, executionContext];
        };
        replaceRequest ||= (() => {
            const mergedPath = mergePath(this._basePath, path);
            const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
            return (request) => {
                const url = new URL(request.url);
                url.pathname = url.pathname.slice(pathPrefixLength) || "/";
                return new Request(url, request);
            };
        })();
        const handler = async (c, next) => {
            const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
            if (res) {
                return res;
            }
            await next();
        };
        this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
        return this;
    }
    #addRoute(method, path, handler) {
        method = method.toUpperCase();
        path = mergePath(this._basePath, path);
        const r = { basePath: this._basePath, path, method, handler };
        this.router.add(method, path, [handler, r]);
        this.routes.push(r);
    }
    #handleError(err, c) {
        if (err instanceof Error) {
            return this.errorHandler(err, c);
        }
        throw err;
    }
    #dispatch(request, executionCtx, env, method) {
        if (method === "HEAD") {
            return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
        }
        const path = this.getPath(request, { env });
        const matchResult = this.router.match(method, path);
        const c = new Context(request, {
            path,
            matchResult,
            env,
            executionCtx,
            notFoundHandler: this.#notFoundHandler
        });
        if (matchResult[0].length === 1) {
            let res;
            try {
                res = matchResult[0][0][0][0](c, async () => {
                    c.res = await this.#notFoundHandler(c);
                });
            } catch (err) {
                return this.#handleError(err, c);
            }
            return res instanceof Promise ? res.then(
                (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
            ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
        }
        const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
        return (async () => {
            try {
                const context = await composed(c);
                if (!context.finalized) {
                    throw new Error(
                        "Context is not finalized. Did you forget to return a Response object or `await next()`?"
                    );
                }
                return context.res;
            } catch (err) {
                return this.#handleError(err, c);
            }
        })();
    }
    /**
     * `.fetch()` will be entry point of your app.
     *
     * @see {@link https://hono.dev/docs/api/hono#fetch}
     *
     * @param {Request} request - request Object of request
     * @param {Env} Env - env Object
     * @param {ExecutionContext} - context of execution
     * @returns {Response | Promise<Response>} response of request
     *
     */
    fetch = (request, ...rest) => {
        return this.#dispatch(request, rest[1], rest[0], request.method);
    };
    /**
     * `.request()` is a useful method for testing.
     * You can pass a URL or pathname to send a GET request.
     * app will return a Response object.
     * ```ts
     * test('GET /hello is ok', async () => {
     *   const res = await app.request('/hello')
     *   expect(res.status).toBe(200)
     * })
     * ```
     * @see https://hono.dev/docs/api/hono#request
     */
    request = (input, requestInit, Env, executionCtx) => {
        if (input instanceof Request) {
            return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
        }
        input = input.toString();
        return this.fetch(
            new Request(
                /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
                requestInit
            ),
            Env,
            executionCtx
        );
    };
    /**
     * `.fire()` automatically adds a global fetch event listener.
     * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
     * @deprecated
     * Use `fire` from `hono/service-worker` instead.
     * ```ts
     * import { Hono } from 'hono'
     * import { fire } from 'hono/service-worker'
     *
     * const app = new Hono()
     * // ...
     * fire(app)
     * ```
     * @see https://hono.dev/docs/api/hono#fire
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
     * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
     */
    fire = () => {
        addEventListener("fetch", (event) => {
            event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
        });
    };
};
var emptyParam = [];
function match(method, path) {
    const matchers = this.buildAllMatchers();
    const match2 = ((method2, path2) => {
        const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
        const staticMatch = matcher[2][path2];
        if (staticMatch) {
            return staticMatch;
        }
        const match3 = path2.match(matcher[0]);
        if (!match3) {
            return [[], emptyParam];
        }
        const index = match3.indexOf("", 1);
        return [matcher[1][index], match3];
    });
    this.match = match2;
    return match2(method, path);
}
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
    if (a.length === 1) {
        return b.length === 1 ? a < b ? -1 : 1 : -1;
    }
    if (b.length === 1) {
        return 1;
    }
    if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
        return 1;
    } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
        return -1;
    }
    if (a === LABEL_REG_EXP_STR) {
        return 1;
    } else if (b === LABEL_REG_EXP_STR) {
        return -1;
    }
    return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node$1 = class _Node {
    #index;
    #varIndex;
    #children = /* @__PURE__ */ Object.create(null);
    insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
        if (tokens.length === 0) {
            if (this.#index !== void 0) {
                throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
                return;
            }
            this.#index = index;
            return;
        }
        const [token, ...restTokens] = tokens;
        const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        let node;
        if (pattern) {
            const name = pattern[1];
            let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
            if (name && pattern[2]) {
                if (regexpStr === ".*") {
                    throw PATH_ERROR;
                }
                regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
                if (/\((?!\?:)/.test(regexpStr)) {
                    throw PATH_ERROR;
                }
            }
            node = this.#children[regexpStr];
            if (!node) {
                if (Object.keys(this.#children).some(
                    (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
                )) {
                    throw PATH_ERROR;
                }
                if (pathErrorCheckOnly) {
                    return;
                }
                node = this.#children[regexpStr] = new _Node();
                if (name !== "") {
                    node.#varIndex = context.varIndex++;
                }
            }
            if (!pathErrorCheckOnly && name !== "") {
                paramMap.push([name, node.#varIndex]);
            }
        } else {
            node = this.#children[token];
            if (!node) {
                if (Object.keys(this.#children).some(
                    (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
                )) {
                    throw PATH_ERROR;
                }
                if (pathErrorCheckOnly) {
                    return;
                }
                node = this.#children[token] = new _Node();
            }
        }
        node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
    }
    buildRegExpStr() {
        const childKeys = Object.keys(this.#children).sort(compareKey);
        const strList = childKeys.map((k) => {
            const c = this.#children[k];
            return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
        });
        if (typeof this.#index === "number") {
            strList.unshift(`#${this.#index}`);
        }
        if (strList.length === 0) {
            return "";
        }
        if (strList.length === 1) {
            return strList[0];
        }
        return "(?:" + strList.join("|") + ")";
    }
};
var Trie = class {
    #context = { varIndex: 0 };
    #root = new Node$1();
    insert(path, index, pathErrorCheckOnly) {
        const paramAssoc = [];
        const groups = [];
        for (let i = 0; ;) {
            let replaced = false;
            path = path.replace(/\{[^}]+\}/g, (m) => {
                const mark = `@\\${i}`;
                groups[i] = [mark, m];
                i++;
                replaced = true;
                return mark;
            });
            if (!replaced) {
                break;
            }
        }
        const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
        for (let i = groups.length - 1; i >= 0; i--) {
            const [mark] = groups[i];
            for (let j = tokens.length - 1; j >= 0; j--) {
                if (tokens[j].indexOf(mark) !== -1) {
                    tokens[j] = tokens[j].replace(mark, groups[i][1]);
                    break;
                }
            }
        }
        this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
        return paramAssoc;
    }
    buildRegExp() {
        let regexp = this.#root.buildRegExpStr();
        if (regexp === "") {
            return [/^$/, [], []];
        }
        let captureIndex = 0;
        const indexReplacementMap = [];
        const paramReplacementMap = [];
        regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
            if (handlerIndex !== void 0) {
                indexReplacementMap[++captureIndex] = Number(handlerIndex);
                return "$()";
            }
            if (paramIndex !== void 0) {
                paramReplacementMap[Number(paramIndex)] = ++captureIndex;
                return "";
            }
            return "";
        });
        return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
    }
};
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
    return wildcardRegExpCache[path] ??= new RegExp(
        path === "*" ? "" : `^${path.replace(
            /\/\*$|([.\\+*[^\]$()])/g,
            (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
        )}$`
    );
}
function clearWildcardRegExpCache() {
    wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
    const trie = new Trie();
    const handlerData = [];
    if (routes.length === 0) {
        return nullMatcher;
    }
    const routesWithStaticPathFlag = routes.map(
        (route) => [!/\*|\/:/.test(route[0]), ...route]
    ).sort(
        ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
    );
    const staticMap = /* @__PURE__ */ Object.create(null);
    for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
        const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
        if (pathErrorCheckOnly) {
            staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
        } else {
            j++;
        }
        let paramAssoc;
        try {
            paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
        } catch (e) {
            throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
        }
        if (pathErrorCheckOnly) {
            continue;
        }
        handlerData[j] = handlers.map(([h, paramCount]) => {
            const paramIndexMap = /* @__PURE__ */ Object.create(null);
            paramCount -= 1;
            for (; paramCount >= 0; paramCount--) {
                const [key, value] = paramAssoc[paramCount];
                paramIndexMap[key] = value;
            }
            return [h, paramIndexMap];
        });
    }
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (let i = 0, len = handlerData.length; i < len; i++) {
        for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
            const map = handlerData[i][j]?.[1];
            if (!map) {
                continue;
            }
            const keys = Object.keys(map);
            for (let k = 0, len3 = keys.length; k < len3; k++) {
                map[keys[k]] = paramReplacementMap[map[keys[k]]];
            }
        }
    }
    const handlerMap = [];
    for (const i in indexReplacementMap) {
        handlerMap[i] = handlerData[indexReplacementMap[i]];
    }
    return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
    if (!middleware) {
        return void 0;
    }
    for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
        if (buildWildcardRegExp(k).test(path)) {
            return [...middleware[k]];
        }
    }
    return void 0;
}
var RegExpRouter = class {
    name = "RegExpRouter";
    #middleware;
    #routes;
    constructor() {
        this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
        this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    }
    add(method, path, handler) {
        const middleware = this.#middleware;
        const routes = this.#routes;
        if (!middleware || !routes) {
            throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        if (!middleware[method]) {
            [middleware, routes].forEach((handlerMap) => {
                handlerMap[method] = /* @__PURE__ */ Object.create(null);
                Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
                    handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
                });
            });
        }
        if (path === "/*") {
            path = "*";
        }
        const paramCount = (path.match(/\/:/g) || []).length;
        if (/\*$/.test(path)) {
            const re = buildWildcardRegExp(path);
            if (method === METHOD_NAME_ALL) {
                Object.keys(middleware).forEach((m) => {
                    middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
                });
            } else {
                middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
            }
            Object.keys(middleware).forEach((m) => {
                if (method === METHOD_NAME_ALL || method === m) {
                    Object.keys(middleware[m]).forEach((p) => {
                        re.test(p) && middleware[m][p].push([handler, paramCount]);
                    });
                }
            });
            Object.keys(routes).forEach((m) => {
                if (method === METHOD_NAME_ALL || method === m) {
                    Object.keys(routes[m]).forEach(
                        (p) => re.test(p) && routes[m][p].push([handler, paramCount])
                    );
                }
            });
            return;
        }
        const paths = checkOptionalParameter(path) || [path];
        for (let i = 0, len = paths.length; i < len; i++) {
            const path2 = paths[i];
            Object.keys(routes).forEach((m) => {
                if (method === METHOD_NAME_ALL || method === m) {
                    routes[m][path2] ||= [
                        ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
                    ];
                    routes[m][path2].push([handler, paramCount - len + i + 1]);
                }
            });
        }
    }
    match = match;
    buildAllMatchers() {
        const matchers = /* @__PURE__ */ Object.create(null);
        Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
            matchers[method] ||= this.#buildMatcher(method);
        });
        this.#middleware = this.#routes = void 0;
        clearWildcardRegExpCache();
        return matchers;
    }
    #buildMatcher(method) {
        const routes = [];
        let hasOwnRoute = method === METHOD_NAME_ALL;
        [this.#middleware, this.#routes].forEach((r) => {
            const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
            if (ownRoute.length !== 0) {
                hasOwnRoute ||= true;
                routes.push(...ownRoute);
            } else if (method !== METHOD_NAME_ALL) {
                routes.push(
                    ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
                );
            }
        });
        if (!hasOwnRoute) {
            return null;
        } else {
            return buildMatcherFromPreprocessedRoutes(routes);
        }
    }
};
var SmartRouter = class {
    name = "SmartRouter";
    #routers = [];
    #routes = [];
    constructor(init) {
        this.#routers = init.routers;
    }
    add(method, path, handler) {
        if (!this.#routes) {
            throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        this.#routes.push([method, path, handler]);
    }
    match(method, path) {
        if (!this.#routes) {
            throw new Error("Fatal error");
        }
        const routers = this.#routers;
        const routes = this.#routes;
        const len = routers.length;
        let i = 0;
        let res;
        for (; i < len; i++) {
            const router = routers[i];
            try {
                for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
                    router.add(...routes[i2]);
                }
                res = router.match(method, path);
            } catch (e) {
                if (e instanceof UnsupportedPathError) {
                    continue;
                }
                throw e;
            }
            this.match = router.match.bind(router);
            this.#routers = [router];
            this.#routes = void 0;
            break;
        }
        if (i === len) {
            throw new Error("Fatal error");
        }
        this.name = `SmartRouter + ${this.activeRouter.name}`;
        return res;
    }
    get activeRouter() {
        if (this.#routes || this.#routers.length !== 1) {
            throw new Error("No active router has been determined yet.");
        }
        return this.#routers[0];
    }
};
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node = class _Node2 {
    #methods;
    #children;
    #patterns;
    #order = 0;
    #params = emptyParams;
    constructor(method, handler, children) {
        this.#children = children || /* @__PURE__ */ Object.create(null);
        this.#methods = [];
        if (method && handler) {
            const m = /* @__PURE__ */ Object.create(null);
            m[method] = { handler, possibleKeys: [], score: 0 };
            this.#methods = [m];
        }
        this.#patterns = [];
    }
    insert(method, path, handler) {
        this.#order = ++this.#order;
        let curNode = this;
        const parts = splitRoutingPath(path);
        const possibleKeys = [];
        for (let i = 0, len = parts.length; i < len; i++) {
            const p = parts[i];
            const nextP = parts[i + 1];
            const pattern = getPattern(p, nextP);
            const key = Array.isArray(pattern) ? pattern[0] : p;
            if (key in curNode.#children) {
                curNode = curNode.#children[key];
                if (pattern) {
                    possibleKeys.push(pattern[1]);
                }
                continue;
            }
            curNode.#children[key] = new _Node2();
            if (pattern) {
                curNode.#patterns.push(pattern);
                possibleKeys.push(pattern[1]);
            }
            curNode = curNode.#children[key];
        }
        curNode.#methods.push({
            [method]: {
                handler,
                possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
                score: this.#order
            }
        });
        return curNode;
    }
    #getHandlerSets(node, method, nodeParams, params) {
        const handlerSets = [];
        for (let i = 0, len = node.#methods.length; i < len; i++) {
            const m = node.#methods[i];
            const handlerSet = m[method] || m[METHOD_NAME_ALL];
            const processedSet = {};
            if (handlerSet !== void 0) {
                handlerSet.params = /* @__PURE__ */ Object.create(null);
                handlerSets.push(handlerSet);
                if (nodeParams !== emptyParams || params && params !== emptyParams) {
                    for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
                        const key = handlerSet.possibleKeys[i2];
                        const processed = processedSet[handlerSet.score];
                        handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
                        processedSet[handlerSet.score] = true;
                    }
                }
            }
        }
        return handlerSets;
    }
    search(method, path) {
        const handlerSets = [];
        this.#params = emptyParams;
        const curNode = this;
        let curNodes = [curNode];
        const parts = splitPath(path);
        const curNodesQueue = [];
        for (let i = 0, len = parts.length; i < len; i++) {
            const part = parts[i];
            const isLast = i === len - 1;
            const tempNodes = [];
            for (let j = 0, len2 = curNodes.length; j < len2; j++) {
                const node = curNodes[j];
                const nextNode = node.#children[part];
                if (nextNode) {
                    nextNode.#params = node.#params;
                    if (isLast) {
                        if (nextNode.#children["*"]) {
                            handlerSets.push(
                                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
                            );
                        }
                        handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
                    } else {
                        tempNodes.push(nextNode);
                    }
                }
                for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
                    const pattern = node.#patterns[k];
                    const params = node.#params === emptyParams ? {} : { ...node.#params };
                    if (pattern === "*") {
                        const astNode = node.#children["*"];
                        if (astNode) {
                            handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
                            astNode.#params = params;
                            tempNodes.push(astNode);
                        }
                        continue;
                    }
                    const [key, name, matcher] = pattern;
                    if (!part && !(matcher instanceof RegExp)) {
                        continue;
                    }
                    const child = node.#children[key];
                    const restPathString = parts.slice(i).join("/");
                    if (matcher instanceof RegExp) {
                        const m = matcher.exec(restPathString);
                        if (m) {
                            params[name] = m[0];
                            handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
                            if (Object.keys(child.#children).length) {
                                child.#params = params;
                                const componentCount = m[0].match(/\//)?.length ?? 0;
                                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                                targetCurNodes.push(child);
                            }
                            continue;
                        }
                    }
                    if (matcher === true || matcher.test(part)) {
                        params[name] = part;
                        if (isLast) {
                            handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
                            if (child.#children["*"]) {
                                handlerSets.push(
                                    ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                                );
                            }
                        } else {
                            child.#params = params;
                            tempNodes.push(child);
                        }
                    }
                }
            }
            curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
        }
        if (handlerSets.length > 1) {
            handlerSets.sort((a, b) => {
                return a.score - b.score;
            });
        }
        return [handlerSets.map(({ handler, params }) => [handler, params])];
    }
};
var TrieRouter = class {
    name = "TrieRouter";
    #node;
    constructor() {
        this.#node = new Node();
    }
    add(method, path, handler) {
        const results = checkOptionalParameter(path);
        if (results) {
            for (let i = 0, len = results.length; i < len; i++) {
                this.#node.insert(method, results[i], handler);
            }
            return;
        }
        this.#node.insert(method, path, handler);
    }
    match(method, path) {
        return this.#node.search(method, path);
    }
};
var Hono = class extends Hono$1 {
    /**
     * Creates an instance of the Hono class.
     *
     * @param options - Optional configuration options for the Hono instance.
     */
    constructor(options = {}) {
        super(options);
        this.router = options.router ?? new SmartRouter({
            routers: [new RegExpRouter(), new TrieRouter()]
        });
    }
};
var cors = (options) => {
    const defaults = {
        origin: "*",
        allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
        allowHeaders: [],
        exposeHeaders: []
    };
    const opts = {
        ...defaults,
        ...options
    };
    const findAllowOrigin = ((optsOrigin) => {
        if (typeof optsOrigin === "string") {
            if (optsOrigin === "*") {
                return () => optsOrigin;
            } else {
                return (origin) => optsOrigin === origin ? origin : null;
            }
        } else if (typeof optsOrigin === "function") {
            return optsOrigin;
        } else {
            return (origin) => optsOrigin.includes(origin) ? origin : null;
        }
    })(opts.origin);
    const findAllowMethods = ((optsAllowMethods) => {
        if (typeof optsAllowMethods === "function") {
            return optsAllowMethods;
        } else if (Array.isArray(optsAllowMethods)) {
            return () => optsAllowMethods;
        } else {
            return () => [];
        }
    })(opts.allowMethods);
    return async function cors2(c, next) {
        function set(key, value) {
            c.res.headers.set(key, value);
        }
        const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
        if (allowOrigin) {
            set("Access-Control-Allow-Origin", allowOrigin);
        }
        if (opts.credentials) {
            set("Access-Control-Allow-Credentials", "true");
        }
        if (opts.exposeHeaders?.length) {
            set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
        }
        if (c.req.method === "OPTIONS") {
            if (opts.origin !== "*") {
                set("Vary", "Origin");
            }
            if (opts.maxAge != null) {
                set("Access-Control-Max-Age", opts.maxAge.toString());
            }
            const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
            if (allowMethods.length) {
                set("Access-Control-Allow-Methods", allowMethods.join(","));
            }
            let headers = opts.allowHeaders;
            if (!headers?.length) {
                const requestHeaders = c.req.header("Access-Control-Request-Headers");
                if (requestHeaders) {
                    headers = requestHeaders.split(/\s*,\s*/);
                }
            }
            if (headers?.length) {
                set("Access-Control-Allow-Headers", headers.join(","));
                c.res.headers.append("Vary", "Access-Control-Request-Headers");
            }
            c.res.headers.delete("Content-Length");
            c.res.headers.delete("Content-Type");
            return new Response(null, {
                headers: c.res.headers,
                status: 204,
                statusText: "No Content"
            });
        }
        await next();
        if (opts.origin !== "*") {
            c.header("Vary", "Origin", { append: true });
        }
    };
};
const INDEX_PROTOCOL = "agent-visibility/0.1";
const KNOWN_AI_AGENTS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "PerplexityBot",
    "Google-Extended",
    "Applebot-Extended",
    "Bytespider",
    "CCBot"
];
function mdLink(text, href) {
    return `[${text}](${href})`;
}
function renderLlmsTxt(ctx) {
    const { site, resources } = ctx;
    const lines = [];
    lines.push(`# ${site.name}`);
    lines.push("");
    lines.push(`> ${site.description}`);
    lines.push("");
    lines.push("Other machine-readable surfaces for this site:");
    lines.push(`- ${mdLink("Full content", `${site.origin}/llms-full.txt`)}`);
    lines.push(`- ${mdLink("Typed JSON index", `${site.origin}/index.json`)}`);
    lines.push("");
    lines.push("## Pages");
    lines.push("");
    for (const r of resources) {
        const summary = r.summary ? ` — ${firstSentence(r.summary)}` : "";
        lines.push(`- ${mdLink(r.title, `${site.origin}/${r.slug}.md`)}${summary}`);
    }
    lines.push("");
    return lines.join("\n");
}
function renderLlmsFullTxt(ctx) {
    const { site, resources } = ctx;
    const lines = [];
    lines.push(`# ${site.name}`);
    lines.push("");
    lines.push(`> ${site.description}`);
    lines.push("");
    for (const r of resources) {
        lines.push(renderResourceMd({ resource: r, site }));
        lines.push("");
        lines.push("---");
        lines.push("");
    }
    return lines.join("\n");
}
function renderIndexJson(ctx) {
    const { site, resources } = ctx;
    return {
        protocol: INDEX_PROTOCOL,
        site: { name: site.name, description: site.description },
        // Derived from the latest content update (not wall-clock) so identical
        // content yields identical output — ETag/cache friendly.
        generatedAt: latestUpdatedAt(resources),
        surfaces: {
            llmsTxt: `${site.origin}/llms.txt`,
            llmsFullTxt: `${site.origin}/llms-full.txt`,
            json: `${site.origin}/index.json`,
            pageMarkdown: `${site.origin}/{slug}.md`,
            robots: `${site.origin}/robots.txt`
        },
        pages: resources.map((r) => ({
            slug: r.slug,
            url: r.url,
            title: r.title,
            summary: r.summary,
            keyPoints: r.keyPoints,
            topics: r.topics,
            category: r.category,
            updatedAt: r.updatedAt,
            sources: {
                markdown: `${site.origin}/${r.slug}.md`,
                canonical: r.url
            }
        }))
    };
}
function renderResourceMd(args) {
    const r = args.resource;
    const lines = [];
    lines.push(`# ${r.title}`);
    lines.push("");
    if (r.category) lines.push(`*Category: ${r.category}*`);
    if (r.topics.length) lines.push(`*Topics: ${r.topics.join(", ")}*`);
    if (r.category || r.topics.length) lines.push("");
    if (r.summary) {
        lines.push(r.summary);
        lines.push("");
    }
    if (r.keyPoints.length) {
        lines.push("## Key points");
        lines.push("");
        for (const k of r.keyPoints) lines.push(`- ${k}`);
        lines.push("");
    }
    if (r.content) {
        lines.push("## Content");
        lines.push("");
        lines.push(r.content);
        lines.push("");
    }
    lines.push("## Source");
    lines.push("");
    lines.push(`- Canonical URL: ${r.url}`);
    lines.push(`- Typed record: ${args.site.origin}/index.json`);
    lines.push("");
    return lines.join("\n");
}
function renderRobotsTxt(ctx) {
    const { site } = ctx;
    const signal = ctx.contentSignal;
    const lines = [];
    lines.push("# Robots directives for AI agents and crawlers.");
    lines.push("# This site intentionally welcomes AI agents — see /llms.txt.");
    lines.push("");
    for (const agent of KNOWN_AI_AGENTS) {
        lines.push(`User-agent: ${agent}`);
        lines.push("Allow: /");
        if (signal) lines.push(`Content-Signal: ${signal}`);
        lines.push("");
    }
    lines.push("User-agent: *");
    lines.push("Allow: /");
    if (signal) lines.push(`Content-Signal: ${signal}`);
    lines.push("");
    lines.push("# Machine-readable indexes for agents:");
    lines.push(`# - ${site.origin}/llms.txt`);
    lines.push(`# - ${site.origin}/index.json`);
    lines.push("");
    return lines.join("\n");
}
function renderWebsiteJsonLd(ctx) {
    const { site, resources } = ctx;
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        description: site.description,
        url: site.origin,
        mainEntity: {
            "@type": "ItemList",
            itemListElement: resources.map((r, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${site.origin}/${r.slug}.md`,
                name: r.title
            }))
        }
    };
}
function renderResourceJsonLd(args) {
    const r = args.resource;
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: r.title,
        abstract: r.summary,
        keywords: r.topics.join(", "),
        articleSection: r.category ?? void 0,
        url: r.url,
        dateModified: r.updatedAt,
        isPartOf: {
            "@type": "WebSite",
            name: args.site.name,
            url: args.site.origin
        }
    };
}
function firstSentence(text) {
    return text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? text;
}
function latestUpdatedAt(resources) {
    let latest = 0;
    for (const r of resources) {
        const t = Date.parse(r.updatedAt);
        if (Number.isFinite(t) && t > latest) latest = t;
    }
    return new Date(latest).toISOString();
}
const MAX_INPUT_BYTES = 6e4;
function trimContent(input) {
    let s = input;
    s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
    s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
    s = s.replace(/<svg[\s\S]*?<\/svg>/gi, "");
    s = s.replace(/<!--[\s\S]*?-->/g, "");
    s = s.replace(/<[^>]+>/g, " ");
    s = s.replace(/\s+/g, " ").trim();
    if (s.length > MAX_INPUT_BYTES) s = s.slice(0, MAX_INPUT_BYTES);
    return s;
}
const SYSTEM_PROMPT = `You prepare web content to be read by AI agents and assistants. The user pastes the raw text of one page. Return STRICT JSON only — no prose, no Markdown fences.

Schema:
{
  "title": string,            // concise page title
  "summary": string,          // 2-4 sentences, plain language, what the page is about and who it's for
  "keyPoints": string[],      // 3-6 short bullet phrases capturing the most important facts
  "topics": string[],         // up to 8 lowercase topic/keyword tags
  "category": string | null,  // one best-fit category label (e.g. "documentation", "pricing", "policy")
  "content": string           // a clean Markdown rewrite of the page body, faithful to the source, no invented facts
}

Rules:
- Use only information present in the input. Never invent facts, prices, or features.
- Keep "content" faithful and well-structured (headings, bullets) but trimmed of navigation/boilerplate.
- Output ONLY the JSON object.`;
function asString(v) {
    if (typeof v === "string") return v;
    if (v == null) return "";
    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
}
function parseJsonLoose(s) {
    try {
        return JSON.parse(s);
    } catch {
        const start = s.indexOf("{");
        const end = s.lastIndexOf("}");
        if (start === -1 || end === -1 || end <= start) return {};
        try {
            return JSON.parse(s.slice(start, end + 1));
        } catch {
            return {};
        }
    }
}
function stringArray(v, max) {
    if (!Array.isArray(v)) return [];
    return v.filter((x) => typeof x === "string").slice(0, max);
}
async function enrichResource(ai, model, raw) {
    const trimmed = trimContent(raw.body);
    try {
        const res = await ai.run(model, {
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: trimmed }
            ],
            max_tokens: 1200
        });
        const parsed = res?.response && typeof res.response === "object" ? res.response : parseJsonLoose(asString(res?.response).trim());
        const title = typeof parsed.title === "string" && parsed.title.trim() || raw.title || deriveTitle(trimmed, raw.slug);
        return {
            slug: raw.slug,
            url: raw.url,
            title,
            summary: typeof parsed.summary === "string" && parsed.summary.trim() || firstSentences(trimmed, 2),
            keyPoints: stringArray(parsed.keyPoints, 6),
            topics: stringArray(parsed.topics, 8).map((t) => t.toLowerCase()),
            category: typeof parsed.category === "string" ? parsed.category : null,
            content: typeof parsed.content === "string" && parsed.content.trim() || trimmed,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            model
        };
    } catch {
        return fallbackEnrichment(raw, model);
    }
}
async function enrichAll(ai, model, raws) {
    const out = [];
    for (const raw of raws) {
        out.push(await enrichResource(ai, model, raw));
    }
    return out;
}
function fallbackEnrichment(raw, model) {
    const trimmed = trimContent(raw.body);
    return {
        slug: raw.slug,
        url: raw.url,
        title: raw.title || deriveTitle(trimmed, raw.slug),
        summary: firstSentences(trimmed, 2),
        keyPoints: [],
        topics: [],
        category: null,
        content: trimmed,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        model: `${model} (fallback)`
    };
}
function deriveTitle(text, slug) {
    const firstLine = text.split(/[.\n]/)[0]?.trim();
    if (firstLine && firstLine.length <= 80) return firstLine;
    return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function firstSentences(text, n) {
    const sentences = text.split(/(?<=[.!?])\s+/).slice(0, n);
    return sentences.join(" ").trim();
}
const SAMPLE_RESOURCES = [
    {
        "slug": "quickstart",
        "url": "https://dikaroute.obitoglory.tech/docs/quickstart",
        "title": "Quickstart",
        "body": "---\ntitle: \"Quickstart\"\ndescription: \"Start using DikaRoute in minutes: installation, dashboard, providers, and API.\"\n---\n\n# Quickstart\n\nThis guide takes you from zero to your first AI request in just a few minutes.\nDikaRoute is an AI gateway that unifies many LLM providers behind a single\nOpenAI-compatible API.\n\n## Prerequisites\n\n- **Node.js** version `>=22.22.2 <23` or `>=24.0.0 <27` (LTS recommended).\n\n```bash\nnode --version\n```\n\n## Installation\n\n### NPM (recommended)\n\n```bash\nnpm install -g dikaroute\n```\n\n### From Source\n\n```bash\ngit clone https://github.com/dikaofc/DikaRoute.git\ncd DikaRoute\nnpm install\nnpm run start\n```\n\n### Docker\n\n```bash\n# Development stack (dashboard + API on :20128)\ndocker compose up -d\n\n# Production stack (split ports)\ndocker compose -f docker-compose.prod.yml up -d\n```\n\n## Running the Dashboard\n\n```bash\ndikaroute\n```\n\nThe dashboard is available at **http://localhost:20128** and the\nOpenAI-compatible API at **http://localhost:20128/v1**.\n\n> Want full background mode? Use `dikaroute serve`.\n\n## First Login\n\n1. Open the dashboard at `http://localhost:20128`.\n2. Log in with the initial password (env var `INITIAL_PASSWORD`, default\n   `CHANGEME`).\n3. Change the password right away at **Dashboard → Settings → Security**.\n\n## Adding a Provider\n\nOpen **Dashboard → Providers** and add your AI provider:\n\n- **OpenAI** — enter your API key (`sk-...`).\n- **Anthropic** — enter your API key (`sk-ant-...`).\n- **Gemini** — enter your Google API key.\n- **Ollama / LM Studio / vLLM** — just set a local `baseUrl`\n  (e.g. `http://localhost:11434`).\n\n> Local providers (Ollama and the like) are only reachable after enabling\n> `DIKAROUTE_ALLOW_PRIVATE_PROVIDER_URLS=true`.\n\n## Using the API\n\nOnce a provider is configured, any app that speaks the OpenAI format can\nconnect straight to `http://localhost:20128/v1`.\n\n### Chat Completion\n\n```bash\ncurl http://localhost:20128/v1/chat/completions \\\n  -H \"Authorization: Bearer YOUR_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"auto\",\n    \"messages\": [\n      { \"role\": \"user\", \"content\": \"Hello AI\" }\n    ]\n  }'\n```\n\n### Streaming (SSE)\n\n```bash\ncurl -N http://localhost:20128/v1/chat/completions \\\n  -H \"Authorization: Bearer YOUR_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"auto\",\n    \"stream\": true,\n    \"messages\": [{ \"role\": \"user\", \"content\": \"Tell me a story\" }]\n  }'\n```\n\n> `\"model\": \"auto\"` lets DikaRoute pick the best provider and model for you\n> automatically.\n\n## Using with Popular Clients\n\nDikaRoute ships one-command setup for many AI clients:\n\n```bash\ndikaroute setup-claude    # Claude Code\ndikaroute setup-codex     # Codex\ndikaroute setup-cursor    # Cursor\ndikaroute setup-cline     # Cline\ndikaroute setup-continue  # Continue\ndikaroute setup-opencode  # OpenCode\n```\n\nEach command configures the matching client to use DikaRoute as its gateway.\n\n## Updating\n\n```bash\ndikaroute update\n```\n\nor:\n\n```bash\nnpm install -g dikaroute@latest\n```\n\n## Next Steps\n\n- 🌐 Read [Architecture](/docs/architecture/overview) to understand how\n  DikaRoute works internally.\n- 🤖 See the full API documentation at `/docs/api` (interactive Redoc).\n- 📱 Running on Android? Check out the [Termux Guide](/docs/guides/termux-guide).\n- 🛠️ Having issues? Run `dikaroute doctor` and `dikaroute logs`.\n"
    },
    {
        "slug": "architecture",
        "url": "https://dikaroute.obitoglory.tech/docs/architecture",
        "title": "Architecture",
        "body": "---\ntitle: \"Architecture\"\ndescription: \"Understand how DikaRoute works: AI gateway, model router, auto-fallback, context compression, and security layers.\"\n---\n\n# DikaRoute Architecture\n\nDikaRoute is an **AI gateway** that unifies many LLM providers (OpenAI,\nAnthropic, Google Gemini, Ollama, and hundreds more) behind **one\nOpenAI-compatible API**. Instead of managing many endpoints, API keys, and SDK\nquirks separately, DikaRoute provides a single entry point that handles\nrouting, fallback, compression, monitoring, and security automatically.\n\n## Overview\n\n```\n                 User Apps\n\n        Claude Code        Cursor\n        Custom Apps    AI Agents\n                 |\n                 |\n          OpenAI Compatible API\n                 |\n                 |\n             DikaRoute\n        ┌──────────┼──────────┐\n        |          |          |\n     Router     Cache     Monitor\n        |          |          |\n        └──────────┼──────────┘\n                   |\n            AI Providers\n     ┌─────────┬─────┬─────────┐\n  OpenAI   Anthropic   Gemini   Ollama · Custom APIs\n```\n\n## Request Flow\n\n1. The client sends an OpenAI-style request to `POST /v1/chat/completions`.\n2. The **Router** picks a provider based on the configured strategy\n   (priority, round-robin, health score, model map, or custom rules).\n3. The pipeline applies **context compression**, **payload rules**, and\n   **rate-limit** / **budget** checks.\n4. If the primary provider fails (429 / 5xx / timeout / outage), the\n   **fallback engine** transparently tries the next healthy provider.\n5. The response is **streamed** (SSE) back to the client while **usage\n   analytics** and **spend tracking** are recorded.\n\n## Core Components\n\n### Router\n\nThe Router decides which provider serves each request. Supported strategies:\n\n| Strategy           | Behavior                                          |\n| ------------------ | ------------------------------------------------- |\n| **Priority**       | Always try providers in your configured order.    |\n| **Round-robin**    | Distribute load evenly across active providers.   |\n| **Auto-fallback**  | Try the primary; move to backups on failure.      |\n| **Health-based**   | Prefer providers with the best health score.      |\n| **Model-based**    | Route by model ID prefix / custom rules.          |\n| **Custom rules**   | Fully custom routing via the rules engine.        |\n\n### Fallback Engine\n\nWhen the primary provider fails due to rate limits, outages, or exhausted\ncredentials, requests automatically fail over to the next healthy provider —\nwith no app changes. Supporting mechanisms:\n\n- **Provider health checks** with configurable intervals and recovery cooldowns.\n- **Connection recovery** — revalidates cooling-down connections outside the\n  hot path.\n- **Emergency fallback** for requests that run out of budget.\n- **Admission control** prevents OOM under heavy concurrent load\n  (HTTP 503 + `Retry-After`).\n\n### Context Compression & Optimization\n\nLong AI conversations burn tokens fast. DikaRoute shrinks payload size while\npreserving useful information:\n\n- **RTK & CCR compression engines** with hot-reloadable payload rules.\n- **Prefix freezing** — keeps stable, cacheable prefixes from compression.\n- **Token & cost tracking** so every conversation's cost is known.\n\n### Monitoring\n\n- Provider status & health score.\n- Request stats, latency, and errors.\n- Token usage, cost, and budgets.\n- Real-time live view over WebSocket.\n\n### Data Storage\n\nAll data is stored in local **SQLite**:\n\n- Provider API keys are encrypted at rest (`API_KEY_SECRET`).\n- Optional full database encryption (`STORAGE_ENCRYPTION_KEY`).\n- Default data location: `~/.dikaroute/` (configurable via `DATA_DIR`).\n\nThe SQLite driver is chosen automatically per platform — on Android/Termux\nDikaRoute uses **sql.js (WASM)** so it always runs without native compilation.\n\n### Dashboard & CLI\n\n- **Web dashboard** (`http://localhost:20128`) to manage providers, models,\n  routing, combos, compression, webhooks, and monitor usage.\n- **CLI** (`dikaroute`) for one-command setup of Claude Code, Codex, Cursor,\n  Cline, and more, plus operational commands like `doctor`, `logs`, `backup`,\n  `tunnel`, and `update`.\n\n## Security Layers\n\n| Layer                       | Purpose                                                      |\n| --------------------------- | ----------------------------------------------------------- |\n| **Secret isolation**        | API keys encrypted in SQLite; optional full DB encryption.   |\n| **SSRF guard**              | Blocks calls to private / cloud-metadata networks.           |\n| **Prompt-injection guard**  | Scans incoming messages for injection patterns (`warn`/`block`). |\n| **PII sanitizer**           | Redacts or blocks PII on requests and responses.             |\n| **Credential masking**      | Hides known API-key patterns in payloads and logs.           |\n| **Rate limits & budgets**   | Per-key and per-IP gates, spend tracking, quota monitoring.  |\n| **Access control**          | `REQUIRE_API_KEY`, scoped MCP, JWT sessions, secure cookies, CORS. |\n\n## Summary\n\nDikaRoute is built with one goal: **one endpoint, many AI providers, maximum\nreliability**. With a thin gateway architecture in front of AI providers,\nDikaRoute handles routing and failure complexity so your apps only ever talk\nto one API.\n"
    },
    {
        "slug": "api",
        "url": "https://dikaroute.obitoglory.tech/docs/api",
        "title": "API Reference",
        "body": "---\ntitle: \"API Reference\"\ndescription: \"DikaRoute exposes an OpenAI-compatible API at /v1.\"\n---\n\n# API Reference\n\nDikaRoute exposes an **OpenAI-compatible API** at `http://localhost:20128/v1`. Any app that\nspeaks the OpenAI format can connect without major changes.\n\n## Endpoints\n\n| Method | Path                          | Description                                        |\n| ------ | ----------------------------- | -------------------------------------------------- |\n| `POST` | `/v1/chat/completions`        | Chat completions — streaming (SSE) and non-streaming. |\n| `GET`  | `/v1/models`                  | List models available through the gateway.         |\n| `POST` | `/v1/responses`               | Codex-style Responses API.                         |\n| `POST` | `/v1/relay/chat/completions`  | Relay endpoint with per-IP rate limiting.          |\n| `WS`   | `/v1/ws`                      | Real-time live monitoring WebSocket.               |\n| `*`    | `/api/mcp`                    | MCP server tools (scope-based access control).     |\n| `GET`  | `/api/openapi.yaml`           | Interactive OpenAPI specification.                 |\n\n## Chat Completion\n\n```bash\ncurl http://localhost:20128/v1/chat/completions \\\n  -H \"Authorization: Bearer YOUR_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"auto\",\n    \"messages\": [\n      { \"role\": \"user\", \"content\": \"Hello AI\" }\n    ]\n  }'\n```\n\n> `\"model\": \"auto\"` lets DikaRoute pick the best provider and model for you automatically.\n\n## Streaming (SSE)\n\n```bash\ncurl -N http://localhost:20128/v1/chat/completions \\\n  -H \"Authorization: Bearer YOUR_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"auto\",\n    \"stream\": true,\n    \"messages\": [{ \"role\": \"user\", \"content\": \"Tell me a story\" }]\n  }'\n```\n\nResponses are streamed back to the client while usage analytics and spend tracking are recorded.\n\n## Request Flow\n\n1. The client sends an OpenAI-style request to `POST /v1/chat/completions`.\n2. The **Router** picks a provider based on the strategy (priority, round-robin, health score, model map…).\n3. The pipeline applies context compression, payload rules, and rate-limit and budget checks.\n4. If the primary provider fails (429 / 5xx / timeout / outage), the **fallback engine** tries the next provider.\n5. The response is streamed (SSE) back to the client while analytics are recorded.\n"
    },
    {
        "slug": "config",
        "url": "https://dikaroute.obitoglory.tech/docs/config",
        "title": "Configuration",
        "body": "---\ntitle: \"Configuration\"\ndescription: \"DikaRoute providers, routing strategies, and environment variables.\"\n---\n\n# Configuration\n\n## Providers\n\nProviders are configured from the dashboard (or `dikaroute providers`), with per-provider API\nkeys, base URLs, models, concurrency, and rate-limit windows.\n\n```json\n{\n  \"providers\": {\n    \"openai\": { \"enabled\": true, \"apiKey\": \"sk-...\" },\n    \"anthropic\": { \"enabled\": true, \"apiKey\": \"sk-ant-...\" },\n    \"ollama\": { \"enabled\": true, \"baseUrl\": \"http://localhost:11434\" }\n  },\n  \"routing\": { \"strategy\": \"auto-fallback\" }\n}\n```\n\n## Routing Strategies\n\n| Strategy          | Behavior                                          |\n| ----------------- | ------------------------------------------------- |\n| **Priority**      | Always try providers in your configured order.    |\n| **Round-robin**   | Distribute load evenly across active providers.   |\n| **Auto-fallback** | Try the primary; cascade to backups on failure.   |\n| **Health-based**  | Prefer providers with the best health score.      |\n| **Model-based**   | Route by model ID prefix / custom rules.          |\n| **Custom rules**  | Fully custom routing via the rules engine.        |\n\n## Environment Variables\n\nCopy `.env.example` → `.env` and adjust. Essentials:\n\n| Variable                                | Purpose                                                | Default                  |\n| --------------------------------------- | ------------------------------------------------------ | ------------------------ |\n| `JWT_SECRET`                            | Signs dashboard session tokens. **Required.**          | —                        |\n| `API_KEY_SECRET`                        | Encrypts provider API keys in SQLite. **Required.**    | —                        |\n| `INITIAL_PASSWORD`                      | Admin password on first boot.                          | `CHANGEME`               |\n| `STORAGE_ENCRYPTION_KEY`                | Full SQLite encryption at rest.                        | empty (off)              |\n| `DATA_DIR`                              | Persistent data directory (DB, logs, backups).         | `~/.dikaroute/`          |\n| `PORT`                                  | Dashboard + API port (single-port mode).               | `20128`                  |\n| `API_PORT` / `DASHBOARD_PORT`           | Split-port mode for network isolation.                 | `20129` / `20128`        |\n| `REQUIRE_API_KEY`                       | Require an API key for all `/v1/*` endpoints.          | `false`                  |\n| `REDIS_URL`                             | Optional Redis for rate limiting.                      | —                        |\n| `DIKAROUTE_ALLOW_PRIVATE_PROVIDER_URLS` | Allow local/private provider URLs (Ollama, vLLM).      | `false`                  |\n| `INPUT_SANITIZER_MODE`                  | Prompt-injection guard mode (`warn` / `block`).        | `warn`                   |\n| `PII_RESPONSE_SANITIZATION`             | Redact PII from LLM responses.                         | `false`                  |\n| `ENABLE_TLS_FINGERPRINT`                | Spoof Chrome TLS fingerprint to avoid blocking.        | `false`                  |\n"
    },
    {
        "slug": "security",
        "url": "https://dikaroute.obitoglory.tech/docs/security",
        "title": "Security",
        "body": "---\ntitle: \"Security\"\ndescription: \"DikaRoute's layered security.\"\n---\n\n# Security\n\n| Layer                        | Purpose                                                                                      |\n| ---------------------------- | ------------------------------------------------------------------------------------------- |\n| **Secret isolation**         | Provider API keys encrypted in SQLite (`API_KEY_SECRET`); optional full DB encryption (`STORAGE_ENCRYPTION_KEY`). |\n| **SSRF guard**               | Blocks outbound calls to private / cloud-metadata networks unless explicitly allowed.        |\n| **Prompt-injection guard**   | Scans incoming messages for injection patterns (`warn` / `block` / threshold mode).          |\n| **PII sanitizer**            | Redacts or blocks PII on requests and LLM responses.                                         |\n| **Credential masking**       | Hides known API-key patterns in payloads and logs.                                           |\n| **Rate limits & budgets**    | Per-key and per-IP gates, spend tracking, quota monitoring.                                  |\n| **Proxy egress**             | HTTP/SOCKS5 egress with fail-closed mode + optional TLS fingerprint spoofing.                |\n| **Access control**           | `REQUIRE_API_KEY`, scoped MCP access, JWT sessions, secure cookies, CORS allow-list.         |\n\n## Best Practices for Production\n\n1. Always set `JWT_SECRET` and `API_KEY_SECRET` to strong random values.\n2. Enable `STORAGE_ENCRYPTION_KEY` for full database encryption.\n3. Require `REQUIRE_API_KEY=true` if the gateway is exposed publicly.\n4. Use `AUTH_COOKIE_SECURE=true` behind HTTPS.\n5. Restrict origins with `CORS_ALLOWED_ORIGINS`.\n6. Monitor regularly with `dikaroute logs` and `dikaroute doctor`.\n"
    },
    {
        "slug": "cli",
        "url": "https://dikaroute.obitoglory.tech/docs/cli",
        "title": "CLI & Ecosystem",
        "body": "---\ntitle: \"CLI & Ecosystem\"\ndescription: \"DikaRoute CLI commands for setup, operations, and management.\"\n---\n\n# CLI & Ecosystem\n\nRun `dikaroute` for the dashboard, or use the CLI for everything:\n\n| Command                                                                                          | Purpose                                   |\n| ------------------------------------------------------------------------------------------------ | ----------------------------------------- |\n| `dikaroute setup-claude`                                                                         | One-command Claude Code integration       |\n| `dikaroute setup-codex`                                                                          | One-command Codex integration             |\n| `dikaroute setup-cursor`                                                                         | One-command Cursor integration            |\n| `dikaroute setup-cline` / `setup-continue` / `setup-roo` / `setup-goose` / `setup-qwen` / `setup-aider` / `setup-opencode` | One-command setup for other agents        |\n| `dikaroute dashboard`                                                                            | Open the web dashboard                    |\n| `dikaroute status` / `health`                                                                    | Gateway & provider health                 |\n| `dikaroute providers` / `models`                                                                 | Manage providers & models                 |\n| `dikaroute keys` / `usage` / `cost` / `tokens`                                                   | Keys, usage, spend, token tracking        |\n| `dikaroute logs` / `doctor`                                                                      | Logs & diagnostics                        |\n| `dikaroute tunnel`                                                                               | ngrok / Cloudflare / Tailscale tunnel     |\n| `dikaroute mcp`                                                                                  | MCP server tooling                        |\n| `dikaroute webhooks`                                                                             | Webhook management                        |\n| `dikaroute backup` / `restart` / `stop` / `serve`                                                | Operational commands                      |\n| `dikaroute update`                                                                               | Self-update                               |\n\n## OAuth & Multi-Account\n\nDikaRoute supports OAuth login for Claude Code, Codex, Gemini, Antigravity, Kimi, GitHub Copilot, GitLab Duo, Qoder, Trae and more — with a **warmup scheduler** for OAuth accounts to avoid cold-window throttling.\n"
    },
    {
        "slug": "docker",
        "url": "https://dikaroute.obitoglory.tech/docs/docker",
        "title": "Docker Deployment",
        "body": "---\ntitle: \"Docker Deployment\"\ndescription: \"Run DikaRoute with Docker.\"\n---\n\n# Docker Deployment\n\n```bash\n# Development stack (dashboard + API on :20128)\ndocker compose up -d\n\n# Production stack (split ports)\ndocker compose -f docker-compose.prod.yml up -d\n```\n\n## Important Notes\n\n- **Data persistence:** mount a host directory to `DATA_DIR` (e.g. `./data` or `/var/lib/dikaroute`).\n- **Production ports:** the host publishes `PROD_DASHBOARD_PORT` (default `20130`) and `PROD_API_PORT` (default `20131`).\n- **Podman:** set `CONTAINER_HOST=podman`.\n- **Behind a proxy:** set `DIKAROUTE_BASE_PATH` to serve a subpath and `NEXT_PUBLIC_BASE_URL` for the public origin.\n\n## From Source\n\n```bash\ngit clone https://github.com/dikaofc/DikaRoute.git\ncd DikaRoute\nnpm install\nnpm run start\n```\n\n## NPM Installation\n\n```bash\nnpm install -g dikaroute\n\n# Start the dashboard (default: http://localhost:20128)\ndikaroute\n\n# Update to the latest version\ndikaroute update\n```\n"
    },
    {
        "slug": "termux",
        "url": "https://dikaroute.obitoglory.tech/docs/termux",
        "title": "Termux Guide",
        "body": "---\ntitle: \"DikaRoute on Termux\"\ndescription: \"Run DikaRoute on Android/Termux: installation, cache dir, and instrumentation troubleshooting.\"\n---\n\n# DikaRoute on Termux (Android)\n\nDikaRoute runs on Android via [Termux](https://termux.dev/). This guide covers the\ncommon platform-specific problems and their fixes.\n\n## Installation\n\n```bash\n# Use the Node.js LTS package (not the default), then install globally\npkg install nodejs-lts\nnpm install -g dikaroute\ndikaroute --version\n```\n\n> Always keep the global install up to date — fixes for Termux land in every\n> release:\n>\n> ```bash\n> npm install -g dikaroute@latest\n> ```\n\n## Starting the server\n\n```bash\ndikaroute serve\n```\n\nThe dashboard is served at `http://localhost:20128` and the OpenAI-compatible\nAPI at `http://localhost:20128/v1`.\n\n---\n\n## Troubleshooting\n\n### Dashboard / API returns `Internal Server Error` (HTTP 500) while the CLI says \"running\"\n\n**Symptom:** `✔ DikaRoute is running!` is printed, but every request returns a\nbare HTTP 500 and the dashboard shows _Internal Server Error_.\n\n**Cause:** the Next.js instrumentation hook failed to load. When that hook never\nruns, the server still binds its ports (so it _looks_ healthy) but every\nDB-touching route 500s forever.\n\nTwo common Termux-specific causes:\n\n1. **Missing Next.js cache directory** — Next.js has no `android` branch in its\n   cache-dir probe. It only accepts a cache root that already exists (`~/.cache`\n   or the tmp dir). The CLI normally creates it for you, but on a fresh install\n   it may not have existed yet.\n2. **A native module failed to load** — historically the SQLite driver\n   (`better-sqlite3` when its compiled binary does not match the Termux Node\n   build, or `node:sqlite` when unavailable in the Termux Node package).\n\n> **Since 3.8.59** this is no longer expected: on Android/Termux the DB driver\n> cascade now **skips native drivers entirely** and goes straight to the\n> bundled **sql.js WASM** driver (pure WebAssembly — no compilation, no ABI\n> matching, always works). See [SQLite driver on Termux](#sqlite-driver-on-termux)\n> below. The remaining realistic cause of a 500 is the missing cache dir (#1).\n\n**Step 1 — see the real error** (the CLI hides child output by default):\n\n```bash\ndikaroute serve --log\n```\n\nLook for the actual failure line, e.g.:\n\n```\nAn error occurred while loading instrumentation hook: ...\n```\n\n**Step 2 — apply the fixes in order:**\n\n```bash\n# 1. Cache probe — make sure ~/.cache exists\nmkdir -p ~/.cache\ndikaroute serve\n\n# 2. Verify the sql.js WASM fallback driver is actually installed.\n#    Termux uses the WASM driver (better-sqlite3 is intentionally skipped), so\n#    if sql-wasm.wasm is missing the server boots to HTTP 500 no matter what\n#    you rebuild. This is the most common real cause of this symptom:\nfind \"$(npm root -g)\" -path '*sql.js/dist/sql-wasm.wasm' -print\n\n#    If nothing is printed, the install is incomplete — reinstall:\nnpm install -g dikaroute@latest --include=optional\n\n# 3. Only after the WASM check passes, rebuild native modules into a\n#    user-writable runtime (works without a C++ toolchain):\ndikaroute runtime repair\n\n# 4. Or rebuild the SQLite driver explicitly (needs a C++ toolchain):\nnpm rebuild better-sqlite3\n```\n\nAfter each fix, restart: `dikaroute serve`.\n\n> `dikaroute runtime repair` and `npm rebuild better-sqlite3` do **not** fix the\n> sql.js WASM driver — on Termux that driver is used instead of\n> better-sqlite3. Only reinstall (step 2) or update fixes a missing\n> `sql-wasm.wasm`.\n\n**Step 3 — if the error persists**, share the full `dikaroute serve --log`\noutput (especially the `An error occurred while loading instrumentation hook: …`\nor `[STARTUP] Fatal: Database driver initialization failed` line) — that\nidentifies the exact module that failed on your device.\n\n### SQLite driver on Termux\n\nDikaRoute detects Android/Termux at boot and **forces the sql.js WASM driver**\n— the native sync drivers (`better-sqlite3`, `node:sqlite`) are skipped before\nthey are even attempted, because their prebuilt binaries do not load on Android.\n\nThis is automatic — no action needed. You should see this line in the logs:\n\n```\n[DB] Android/Termux detected — forcing sql.js WASM driver (native sync drivers unreliable on Android)\n[DB] Driver: sql.js | file: ...\n```\n\nOn any other platform you can opt into the same behavior explicitly with:\n\n```bash\nDIKAROUTE_FORCE_SQLJS=1 dikaroute serve\n```\n\nsql.js is slower than the native drivers (it loads the database file into WASM\nmemory) but is fully functional — the right trade-off for Termux reliability.\n\n### `Unsupported platform: android`\n\nNext.js's `getCacheDirectory()` has no `android` branch. On Termux it falls back\nto a generic tmp location, which only succeeds when `~/.cache` (or the tmp dir)\nalready exists. This is the root cause of the instrumentation failure above:\n\n```bash\nmkdir -p ~/.cache\ndikaroute serve\n```\n\n### `module.register() is deprecated` warning\n\nHarmless Node.js deprecation notice. Ignore it.\n\n### Native module rebuild guidance\n\nTermux usually has no full C++ toolchain. Prefer:\n\n```bash\ndikaroute runtime repair\n```\n\nThis rebuilds required native modules into a user-writable runtime directory\nwithout needing `make`/`gcc`. Only fall back to `npm rebuild …` when a toolchain\nis installed.\n\n> Since 3.8.59 the SQLite driver is **not** one of those native modules on\n> Termux anymore — `npm rebuild better-sqlite3` is unnecessary there (sql.js\n> WASM is used instead). The runtime-repair path still matters for other\n> optional native pieces (e.g. `wreq-js`).\n>\n> The sql.js WASM driver is a **regular dependency** (`sql.js`), so a normal\n> `npm install -g dikaroute` places `sql-wasm.wasm` under the global\n> `node_modules` (typically `$(npm root -g)/node_modules/sql.js/dist/`).\n> DikaRoute resolves it relative to the installed package rather than the\n> current directory, so it works from any working directory. If it is missing,\n> reinstall (`npm install -g dikaroute@latest --include=optional`) — no native\n> rebuild will restore it.\n"
    }
];
const ENRICHED_KEY = "resources:enriched";
const RAW_KEY = "resources:raw";
function siteConfig(env, origin) {
    return {
        name: env.SITE_NAME || "DikaRoute",
        description: env.SITE_DESCRIPTION || "DikaRoute is a free and open-source unified AI gateway. It exposes a single OpenAI-compatible endpoint (/v1) that routes requests to many LLM providers with automatic fallback, configurable routing strategies, and layered security. This documentation is published as machine-readable surfaces (llms.txt, index.json) so AI agents can understand the project accurately.",
        origin
    };
}
function ttlSeconds(env) {
    const n = Number(env.ENRICHMENT_CACHE_TTL);
    return Number.isFinite(n) && n > 0 ? n : 3600;
}
const DEGRADED_TTL = 60;
function isDegraded(resources) {
    return resources.some((r) => r.model.endsWith("(fallback)"));
}
function cacheTtl(env, resources) {
    return isDegraded(resources) ? DEGRADED_TTL : ttlSeconds(env);
}
async function getRawResources(env) {
    const stored = await env.VISIBILITY_CACHE.get(RAW_KEY, "json");
    if (Array.isArray(stored) && stored.length) {
        return stored;
    }
    return SAMPLE_RESOURCES;
}
async function getResources(env) {
    const cached = await env.VISIBILITY_CACHE.get(ENRICHED_KEY, "json");
    if (Array.isArray(cached) && cached.length) {
        return cached;
    }
    const raws = await getRawResources(env);
    const enriched = await enrichAll(env.AI, env.AI_MODEL, raws);
    await env.VISIBILITY_CACHE.put(ENRICHED_KEY, JSON.stringify(enriched), {
        expirationTtl: cacheTtl(env, enriched)
    });
    return enriched;
}
async function upsertResource(env, raw, maxResources = 100) {
    const raws = await getRawResources(env);
    const isNew = !raws.some((r) => r.slug === raw.slug);
    if (isNew && raws.length >= maxResources) {
        throw new Error("RESOURCE_LIMIT");
    }
    const nextRaws = [...raws.filter((r) => r.slug !== raw.slug), raw];
    await env.VISIBILITY_CACHE.put(RAW_KEY, JSON.stringify(nextRaws));
    const enriched = await enrichResource(env.AI, env.AI_MODEL, raw);
    const cached = await env.VISIBILITY_CACHE.get(ENRICHED_KEY, "json");
    let others;
    if (Array.isArray(cached) && cached.length) {
        others = cached.filter((r) => r.slug !== raw.slug);
    } else {
        const otherRaws = nextRaws.filter((r) => r.slug !== raw.slug);
        others = await enrichAll(env.AI, env.AI_MODEL, otherRaws);
    }
    const next = [...others, enriched];
    await env.VISIBILITY_CACHE.put(ENRICHED_KEY, JSON.stringify(next), {
        expirationTtl: cacheTtl(env, next)
    });
    return enriched;
}
async function clearCache(env) {
    // Full reset: purge both the raw resource list and the enriched cache so the
    // surfaces re-serve the bundled DikaRoute docs (SAMPLE_RESOURCES) baseline.
    await env.VISIBILITY_CACHE.delete(ENRICHED_KEY);
    await env.VISIBILITY_CACHE.delete(RAW_KEY);
}
const SAMPLE_AGENT_KEYS = [
    {
        keyid: "sample-agent-2026",
        publicKey: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo",
        label: "DikaRoute sample agent (replace me)"
    }
];
function b64urlToBytes(s) {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - s.length % 4);
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}
function parseSignatureInput(value) {
    const eq = value.indexOf("=");
    if (eq === -1) return null;
    const label = value.slice(0, eq).trim();
    const rest = value.slice(eq + 1);
    const compMatch = rest.match(/\(([^)]*)\)/);
    if (!compMatch) return null;
    const components = (compMatch[1].match(/"([^"]+)"/g) ?? []).map(
        (c) => c.replace(/"/g, "")
    );
    const keyidMatch = rest.match(/keyid="([^"]+)"/);
    return { label, components, keyid: keyidMatch?.[1] };
}
function buildSignatureBase(request, components, signatureParams) {
    const url = new URL(request.url);
    const lines = [];
    for (const comp of components) {
        let val = "";
        if (comp === "@authority") val = url.host;
        else if (comp === "@path") val = url.pathname;
        else if (comp === "@method") val = request.method;
        else if (comp === "@target-uri") val = request.url;
        else val = request.headers.get(comp) ?? "";
        lines.push(`"${comp}": ${val}`);
    }
    lines.push(`"@signature-params": ${signatureParams}`);
    return lines.join("\n");
}
async function verifyAgentIdentity(request, keys) {
    const sigInput = request.headers.get("Signature-Input");
    const sigHeader = request.headers.get("Signature");
    if (!sigInput || !sigHeader) return { signed: false, verified: false };
    const parsed = parseSignatureInput(sigInput);
    if (!parsed) {
        return {
            signed: true,
            verified: false,
            reason: "Malformed Signature-Input"
        };
    }
    if (!/^[A-Za-z0-9_-]+$/.test(parsed.label)) {
        return { signed: true, verified: false, reason: "Invalid signature label" };
    }
    const key = keys.find((k) => k.keyid === parsed.keyid);
    if (!key) {
        return {
            signed: true,
            verified: false,
            keyid: parsed.keyid,
            reason: "Unknown keyid"
        };
    }
    try {
        const sigMatch = sigHeader.match(new RegExp(`${parsed.label}=:([^:]+):`));
        if (!sigMatch) {
            return {
                signed: true,
                verified: false,
                keyid: parsed.keyid,
                reason: "Missing signature value"
            };
        }
        const paramsMatch = sigInput.match(/=(\(.*)$/);
        const signatureParams = paramsMatch ? paramsMatch[1] : "()";
        const base = buildSignatureBase(
            request,
            parsed.components,
            signatureParams
        );
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            b64urlToBytes(key.publicKey),
            { name: "Ed25519" },
            false,
            ["verify"]
        );
        const ok = await crypto.subtle.verify(
            "Ed25519",
            cryptoKey,
            b64urlToBytes(sigMatch[1]),
            new TextEncoder().encode(base)
        );
        return {
            signed: true,
            verified: ok,
            keyid: parsed.keyid,
            reason: ok ? void 0 : "Signature did not verify"
        };
    } catch (err) {
        return {
            signed: true,
            verified: false,
            keyid: parsed.keyid,
            reason: `Verification error: ${err.message}`
        };
    }
}
function directoryDocument(keys) {
    return {
        purpose: "web-bot-auth",
        description: "Public keys this site trusts for Web Bot Auth (RFC 9421, Ed25519).",
        keys: keys.map((k) => ({
            keyid: k.keyid,
            kty: "OKP",
            crv: "Ed25519",
            x: k.publicKey,
            label: k.label
        }))
    };
}
const app = new Hono();
app.onError((err, c) => {
    console.error(`[Error] ${c.req.method} ${c.req.path}: ${err.message}`);
    if (/\.(md|txt)$/.test(c.req.path)) {
        return c.text("Internal server error", 500);
    }
    return c.json({ error: "Internal server error" }, 500);
});
function originOf(url) {
    return new URL(url).origin;
}
const MAX_BODY_BYTES = 1e5;
const MAX_RESOURCES = 100;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;
function isAuthorized(c) {
    const configured = c.env.ADMIN_TOKEN;
    if (!configured) return false;
    const header = c.req.header("authorization") ?? "";
    const token = header.replace(/^Bearer\s+/i, "");
    return token.length > 0 && token === configured;
}
function contentSignal(c) {
    return {
        "Content-Signal": c.env.CONTENT_SIGNAL || "ai-input=yes, search=yes, ai-train=no"
    };
}
app.use("/llms.txt", cors());
app.use("/llms-full.txt", cors());
app.use("/index.json", cors());
app.use("/jsonld", cors());
app.use("/:file{.+\\.md}", cors());
app.use("/:file{.+\\.jsonld}", cors());
app.get("/", (c) => {
    const site = siteConfig(c.env, originOf(c.req.url));
    const resource = SAMPLE_RESOURCES[0];
    return c.html(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${site.name} — AI Agent Visibility</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: #0b0f1a; color: #e6e9f2; }
  main { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  h1 span { color: #22d3ee; }
  p.lead { color: #9aa4bf; margin-top: 0; }
  ul { list-style: none; padding: 0; }
  li { margin: 10px 0; }
  a { color: #67e8f9; text-decoration: none; border-bottom: 1px solid #164e63; }
  a:hover { color: #a5f3fc; }
  code { background: #161d31; padding: 2px 6px; border-radius: 4px; font-size: .9em; }
  footer { margin-top: 48px; color: #5b6478; font-size: .85rem; }
</style>
</head>
<body>
<main>
  <h1>${site.name} <span>· AI Agent Visibility</span></h1>
  <p class="lead">${site.description}</p>
  <h2>Machine-readable surfaces</h2>
  <ul>
    <li><a href="/llms.txt">/llms.txt</a> — concise markdown index for LLMs</li>
    <li><a href="/llms-full.txt">/llms-full.txt</a> — full documentation in one file</li>
    <li><a href="/index.json">/index.json</a> — typed JSON index (<code>agent-visibility/0.1</code>)</li>
    <li><a href="/robots.txt">/robots.txt</a> — AI-agent friendly directives</li>
    <li><a href="/jsonld">/jsonld</a> — WebSite JSON-LD</li>
    <li><a href="/api/resources">/api/resources</a> — resources API</li>
    <li><a href="/${resource.slug}.md">/${resource.slug}.md</a> — first page (example)</li>
  </ul>
  <h2>Website</h2>
  <p><a href="https://dikaroute.obitoglory.tech">dikaroute.obitoglory.tech</a> — the DikaRoute website &amp; docs.</p>
  <footer>${site.name} — content served with intent for AI agents. See /robots.txt.</footer>
</main>
</body>
</html>`);
});
app.get("/llms.txt", async (c) => {
    const site = siteConfig(c.env, originOf(c.req.url));
    const resources = await getResources(c.env);
    return c.text(renderLlmsTxt({ site, resources }), 200, {
        "Content-Type": "text/plain; charset=utf-8",
        ...contentSignal(c)
    });
});
app.get("/llms-full.txt", async (c) => {
    const site = siteConfig(c.env, originOf(c.req.url));
    const resources = await getResources(c.env);
    return c.text(renderLlmsFullTxt({ site, resources }), 200, {
        "Content-Type": "text/plain; charset=utf-8",
        ...contentSignal(c)
    });
});
app.get("/index.json", async (c) => {
    const site = siteConfig(c.env, originOf(c.req.url));
    const resources = await getResources(c.env);
    c.header("Content-Signal", contentSignal(c)["Content-Signal"]);
    return c.json(renderIndexJson({ site, resources }));
});
app.get("/robots.txt", async (c) => {
    const site = siteConfig(c.env, originOf(c.req.url));
    await getResources(c.env);
    return c.text(
        renderRobotsTxt({
            site,
            contentSignal: contentSignal(c)["Content-Signal"]
        }),
        200,
        {
            "Content-Type": "text/plain; charset=utf-8",
            ...contentSignal(c)
        }
    );
});
app.get("/jsonld", async (c) => {
    const site = siteConfig(c.env, originOf(c.req.url));
    const resources = await getResources(c.env);
    return c.json(renderWebsiteJsonLd({ site, resources }), 200, {
        "Content-Type": "application/ld+json; charset=utf-8",
        ...contentSignal(c)
    });
});
app.get("/:file{.+\\.md}", async (c) => {
    const slug = c.req.param("file").replace(/\.md$/, "");
    const site = siteConfig(c.env, originOf(c.req.url));
    const resources = await getResources(c.env);
    const resource = resources.find((r) => r.slug === slug);
    if (!resource) return c.notFound();
    return c.text(renderResourceMd({ resource, site }), 200, {
        "Content-Type": "text/markdown; charset=utf-8",
        ...contentSignal(c)
    });
});
app.get("/:file{.+\\.jsonld}", async (c) => {
    const slug = c.req.param("file").replace(/\.jsonld$/, "");
    const site = siteConfig(c.env, originOf(c.req.url));
    const resources = await getResources(c.env);
    const resource = resources.find((r) => r.slug === slug);
    if (!resource) return c.notFound();
    return c.json(renderResourceJsonLd({ resource, site }), 200, {
        "Content-Type": "application/ld+json; charset=utf-8",
        ...contentSignal(c)
    });
});
app.get("/api/site", async (c) => {
    const site = siteConfig(c.env, originOf(c.req.url));
    return c.json({
        site,
        webBotAuthEnabled: c.env.ENABLE_WEB_BOT_AUTH === "true",
        surfaces: [
            { id: "llms-txt", label: "llms.txt", path: "/llms.txt", kind: "text" },
            {
                id: "llms-full",
                label: "llms-full.txt",
                path: "/llms-full.txt",
                kind: "text"
            },
            {
                id: "index-json",
                label: "index.json",
                path: "/index.json",
                kind: "json"
            },
            { id: "robots", label: "robots.txt", path: "/robots.txt", kind: "text" },
            { id: "jsonld", label: "JSON-LD", path: "/jsonld", kind: "json" }
        ]
    });
});
app.get("/api/resources", async (c) => {
    const resources = await getResources(c.env);
    return c.json({ count: resources.length, resources });
});
app.get("/api/resources/:slug", async (c) => {
    const resources = await getResources(c.env);
    const resource = resources.find((r) => r.slug === c.req.param("slug"));
    if (!resource) return c.json({ error: "Not found" }, 404);
    return c.json(resource);
});
app.post("/api/resources", async (c) => {
    if (!isAuthorized(c)) {
        return c.json({ error: "Unauthorized. Set the ADMIN_TOKEN secret." }, 401);
    }
    const body = await c.req.json().catch(() => null);
    if (!body?.slug || !body?.body) {
        return c.json({ error: "Missing required fields: slug, body" }, 400);
    }
    const slug = String(body.slug);
    if (!SLUG_RE.test(slug)) {
        return c.json({ error: "Invalid slug: use 1–63 chars of [a-z0-9-]." }, 400);
    }
    const rawBody = String(body.body);
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
        return c.json(
            { error: `Body too large (max ${MAX_BODY_BYTES} bytes).` },
            400
        );
    }
    let url = `${originOf(c.req.url)}/${slug}`;
    if (body.url) {
        try {
            const parsed = new URL(String(body.url));
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return c.json({ error: "url must be http(s)." }, 400);
            }
            url = parsed.toString();
        } catch {
            return c.json({ error: "url is not a valid URL." }, 400);
        }
    }
    const raw = {
        slug,
        url,
        title: body.title ? String(body.title).slice(0, 200) : void 0,
        body: rawBody
    };
    try {
        const enriched = await upsertResource(c.env, raw, MAX_RESOURCES);
        return c.json(enriched, 201);
    } catch (err) {
        if (err.message === "RESOURCE_LIMIT") {
            return c.json(
                { error: `Resource limit reached (max ${MAX_RESOURCES}).` },
                409
            );
        }
        throw err;
    }
});
app.post("/api/refresh", async (c) => {
    if (!isAuthorized(c)) {
        return c.json({ error: "Unauthorized. Set the ADMIN_TOKEN secret." }, 401);
    }
    await clearCache(c.env);
    return c.json({
        ok: true,
        message: "Cache cleared; surfaces will re-enrich."
    });
});
app.get("/.well-known/web-bot-auth/directory", (c) => {
    if (c.env.ENABLE_WEB_BOT_AUTH !== "true") return c.notFound();
    return c.json(directoryDocument(SAMPLE_AGENT_KEYS));
});
app.all("/api/identity", async (c) => {
    if (c.env.ENABLE_WEB_BOT_AUTH !== "true") {
        return c.json({ error: "Web Bot Auth is disabled" }, 404);
    }
    const result = await verifyAgentIdentity(c.req.raw, SAMPLE_AGENT_KEYS);
    return c.json(result);
});
const workerEntry = app ?? {};
export {
    workerEntry as default
};


// ── DikaRoute AI Agent Visibility worker — end ──
