/** Small Express test helpers for invoking route handlers without a server. */
export const findRouteHandlers = (app: any, path: string, method: string, mountPath?: string) => {
  const routers = app._router.stack
    .filter((layer: any) =>
      layer.name === "router" && (!mountPath || layer.regexp.test(mountPath))
    )
    .map((layer: any) => layer.handle);
  const route = routers
    .flatMap((router: any) => router.stack)
    .find((layer: any) => layer.route?.path === path && layer.route.methods[method]);
  if (!route) throw new Error(`Route not found: ${mountPath || ""} ${method.toUpperCase()} ${path}`);
  return route.route.stack.map((layer: any) => layer.handle);
};

export const createResponse = () => ({
  locals: {} as Record<string, any>,
  cookies: [] as Array<{ name: string; value: any; options: any }>,
  clearedCookies: [] as Array<{ name: string; options: any }>,
  statusCode: 200,
  body: undefined as any,
  cookie(name: string, value: any, options: any) {
    this.cookies.push({ name, value, options });
    return this;
  },
  clearCookie(name: string, options: any) {
    this.clearedCookies.push({ name, options });
    return this;
  },
  json(body: any) {
    this.body = body;
    return this;
  },
  send(body: any) {
    this.body = body;
    return this;
  },
  sendStatus(statusCode: number) {
    this.statusCode = statusCode;
    return this;
  },
});

/** Runs middleware in order, including async handlers that call next(). */
export const invokeRoute = async (
  handlers: Array<(...args: any[]) => any>,
  req: any,
  res: ReturnType<typeof createResponse>
) => {
  for (const handler of handlers) {
    let shouldContinue = false;
    await handler(req, res, (error?: unknown) => {
      if (error) throw error;
      shouldContinue = true;
    });
    if (!shouldContinue) return;
  }
};
