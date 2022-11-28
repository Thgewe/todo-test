import {useState} from "react";

/**
 * Выполняет асинхронный callback. Возвращает функцию, которая пробует выполнить callback,
 * состояние загрузки и состояние ошибки.
 * @param callback
 * @return {[((function(...[*]): Promise<void>)|*),boolean,string]}
 */
export const useFetch = (callback) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetching = async (...args) => {
        try {
            setLoading(true)
            await callback(...args)
        } catch(e) {
            setLoading(false)
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return [fetching, loading, error]
}