/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Local HTTP fixture server for E2E filter download tests. It records
 * every received request so assertions can be made on the server side.
 *
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { type AddressInfo } from 'node:net';

/**
 * Request recorded by the fixture server.
 */
export type E2EFixtureRequest = {
    /**
     * HTTP method.
     */
    method: string;

    /**
     * Request path without the query string.
     */
    path: string;

    /**
     * Full request URL.
     */
    url: string;

    /**
     * Request headers with lowercase names.
     */
    headers: Record<string, string>;

    /**
     * Time when the request was received, in milliseconds.
     */
    timestamp: number;
};

/**
 * Response description for a fixture route.
 */
export type E2EFixtureResponse = {
    /**
     * HTTP status code.
     */
    status?: number;

    /**
     * Response body.
     */
    body?: string;

    /**
     * Response headers.
     */
    headers?: Record<string, string>;
};

/**
 * Context passed to a fixture route handler.
 */
export type E2EFixtureHandlerContext = {
    /**
     * Recorded request.
     */
    request: E2EFixtureRequest;

    /**
     * Raw incoming request.
     */
    rawRequest: IncomingMessage;

    /**
     * One-based hit number for the route.
     */
    hit: number;

    /**
     * Server response.
     */
    response: ServerResponse;
};

/**
 * Fixture route handler.
 */
export type E2EFixtureHandler = (context: E2EFixtureHandlerContext) => void;

/**
 * Content type used by all filter fixture responses.
 */
const TEXT_CONTENT_TYPE = 'text/plain';

/**
 * Local fixture server bound to an ephemeral port on 127.0.0.1.
 */
export class E2EFixtureServer {
    private server: http.Server | undefined;

    private origin = '';

    private handlers = new Map<string, E2EFixtureHandler>();

    private recordedRequests: E2EFixtureRequest[] = [];

    private hitCounts = new Map<string, number>();

    /**
     * Starts the server on an ephemeral port.
     *
     * @returns Nothing.
     */
    public async start(): Promise<void> {
        this.server = http.createServer((request, response) => {
            this.handleRequest(request, response);
        });

        await new Promise<void>((resolve, reject) => {
            this.server!.once('error', reject);
            this.server!.listen(0, '127.0.0.1', () => resolve());
        });

        const address = this.server.address() as AddressInfo;
        this.origin = `http://127.0.0.1:${address.port}`;
    }

    /**
     * Stops the server.
     *
     * @returns Nothing.
     */
    public async stop(): Promise<void> {
        if (!this.server) {
            return;
        }

        await new Promise<void>((resolve) => {
            this.server!.close(() => resolve());
        });

        this.server = undefined;
    }

    /**
     * Creates an absolute URL for a fixture path.
     *
     * @param fixturePath Fixture path starting with a slash.
     *
     * @returns Absolute fixture URL.
     */
    public getUrl(fixturePath: string): string {
        return `${this.origin}${fixturePath}`;
    }

    /**
     * Registers a route handler.
     *
     * @param fixturePath Fixture path starting with a slash.
     * @param handler Route handler.
     */
    public setHandler(fixturePath: string, handler: E2EFixtureHandler): void {
        this.handlers.set(fixturePath, handler);
    }

    /**
     * Serves a text response.
     *
     * @param fixturePath Fixture path starting with a slash.
     * @param body Response body.
     * @param options Response options.
     * @param options.status HTTP status code.
     * @param options.headers Extra response headers.
     */
    public serveText(
        fixturePath: string,
        body: string,
        options: Pick<E2EFixtureResponse, 'status' | 'headers'> = {},
    ): void {
        const { status = 200, headers = {} } = options;

        this.serveSequence(fixturePath, [{ status, body, headers }]);
    }

    /**
     * Serves an empty 200 response.
     *
     * @param fixturePath Fixture path starting with a slash.
     */
    public serveEmpty(fixturePath: string): void {
        this.serveText(fixturePath, '');
    }

    /**
     * Serves an error status with an empty body.
     *
     * @param fixturePath Fixture path starting with a slash.
     * @param status HTTP status code.
     */
    public serveStatus(fixturePath: string, status: number): void {
        this.serveText(fixturePath, '', { status });
    }

    /**
     * Serves responses by hit number. The last response is repeated.
     *
     * @param fixturePath Fixture path starting with a slash.
     * @param responses Responses in hit order.
     */
    public serveSequence(fixturePath: string, responses: E2EFixtureResponse[]): void {
        this.setHandler(fixturePath, ({
            request,
            hit,
            response,
        }) => {
            const spec = responses[Math.min(hit - 1, responses.length - 1)];

            if (!spec) {
                response.writeHead(404, { 'Content-Type': TEXT_CONTENT_TYPE });
                response.end('missing fixture response');
                return;
            }

            response.writeHead(spec.status ?? 200, {
                'Content-Type': TEXT_CONTENT_TYPE,
                ...spec.headers,
            });
            response.end(request.method === 'HEAD' ? undefined : spec.body ?? '');
        });
    }

    /**
     * Aborts every request received within the given window after the first
     * request, then serves a text response.
     *
     * Chromium resends a request when the server closes a reused connection
     * before the response. A single aborted request would therefore let the
     * browser resend succeed and hide the retry of the caller. This method
     * keeps the network failure for the whole window, so only a request sent
     * after the window succeeds.
     *
     * @param fixturePath Fixture path starting with a slash.
     * @param windowMs Duration of the network failure in milliseconds.
     * @param body Response body served after the window.
     * @param options Response options.
     * @param options.status HTTP status code.
     * @param options.headers Extra response headers.
     */
    public serveAbortWindow(
        fixturePath: string,
        windowMs: number,
        body: string,
        options: Pick<E2EFixtureResponse, 'status' | 'headers'> = {},
    ): void {
        const { status = 200, headers = {} } = options;
        let firstRequestTimestamp: number | undefined;

        this.setHandler(fixturePath, ({
            request,
            rawRequest,
            response,
        }) => {
            firstRequestTimestamp ??= request.timestamp;

            if (request.timestamp - firstRequestTimestamp < windowMs) {
                rawRequest.socket.destroy();
                return;
            }

            response.writeHead(status, {
                'Content-Type': TEXT_CONTENT_TYPE,
                ...headers,
            });
            response.end(request.method === 'HEAD' ? undefined : body);
        });
    }

    /**
     * Clears routes, recorded requests and hit counters.
     */
    public reset(): void {
        this.handlers.clear();
        this.recordedRequests = [];
        this.hitCounts.clear();
    }

    /**
     * Returns recorded requests for a path.
     *
     * @param fixturePath Fixture path starting with a slash.
     *
     * @returns Recorded requests.
     */
    public getRequests(fixturePath: string): E2EFixtureRequest[] {
        return this.recordedRequests.filter((request) => request.path === fixturePath);
    }

    /**
     * Handles one incoming request.
     *
     * @param request Incoming request.
     * @param response Server response.
     */
    private handleRequest(request: IncomingMessage, response: ServerResponse): void {
        const requestUrl = new URL(request.url ?? '/', this.origin);
        const path = requestUrl.pathname;
        const headers: Record<string, string> = {};

        Object.entries(request.headers).forEach(([name, value]) => {
            headers[name] = Array.isArray(value) ? value.join(',') : value ?? '';
        });

        const recordedRequest: E2EFixtureRequest = {
            method: request.method ?? 'GET',
            path,
            url: requestUrl.href,
            headers,
            timestamp: Date.now(),
        };

        this.recordedRequests.push(recordedRequest);

        const hit = (this.hitCounts.get(path) ?? 0) + 1;
        this.hitCounts.set(path, hit);

        const handler = this.handlers.get(path);

        if (!handler) {
            response.writeHead(404, { 'Content-Type': TEXT_CONTENT_TYPE });
            response.end('not found');
            return;
        }

        try {
            handler({
                request: recordedRequest,
                rawRequest: request,
                hit,
                response,
            });
        } catch (error: unknown) {
            response.writeHead(500, { 'Content-Type': TEXT_CONTENT_TYPE });
            response.end(error instanceof Error ? error.message : String(error));
        }
    }
}
