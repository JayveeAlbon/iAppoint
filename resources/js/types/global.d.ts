declare function route(name: string, params?: Record<string, unknown> | number | string): string;
declare namespace route {
    function current(name?: string): boolean | string;
}
