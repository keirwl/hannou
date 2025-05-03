export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number = 300,
): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    return function(...args: Parameters<T>): void {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    }
}

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
    func: T,
    wait: number = 300,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: number | null = null;
    let pendingPromise: Promise<ReturnType<T>> | null = null;

    return function(...args: Parameters<T>): Promise<ReturnType<T>> {
        if (pendingPromise) {
            return pendingPromise;
        }

        pendingPromise = new Promise((resolve, reject) => {
            const later = async () => {
                timeout = null;
                try {
                    const result = await func(...args);
                    resolve(result);
                    pendingPromise = null;
                } catch (error) {
                    reject(error);
                    pendingPromise = null;
                }
            };

            if (timeout !== null) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(later, wait);
        });

        return pendingPromise;
    }
}

export function getCookie(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
}
