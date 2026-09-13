import proxy from "express-http-proxy";

export const proxyWithHeader = (serviceUrl) => {
    return proxy(serviceUrl, {
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            // Add the Authorization header from the incoming request to the proxied request
            if (srcReq.user) {
                proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
            }
            return proxyReqOpts
        }
    })
}