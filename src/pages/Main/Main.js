import React, {useEffect, useRef, useState} from 'react';
import './main.less';
import {getDocs, query, collection, deleteDoc, addDoc, orderBy, updateDoc} from 'firebase/firestore';
import CardList from "../../components/CardList/CardList";
import {useFetch} from "../../hooks/useFetch";
import {db} from "../../firebase";
import dayjs from "dayjs";
import Loading from "../../components/Loading/Loading";

/**
 * Страница с задачами
 * @return {JSX.Element}
 * @constructor
 */
const Main = () => {

    const [queue, setQueue] = useState([]);
    const [development, setDevelopment] = useState([]);
    const [done, setDone] = useState([]);

    /**
     * Указывает, идет ли сейчас синхронизация с сервером
     * @type {React.MutableRefObject<boolean>}
     */
    const sync = useRef(false);

    /**
     * Массив возможных статусов
     * @type {string[]}
     */
    const statuses = ['queue', 'development', 'done'];

    /**
     * Запрашивает все задачи с сервера
     */
    const [fetching, loading, error] = useFetch(async () => {
        const rawQueue = [],
            rawDevelopment = [],
            rawDone = [];

        for (let val of statuses) {
            const querySnapshot = await getDocs(query(collection(db, val), orderBy('createdAt')))
            querySnapshot.forEach((doc) => {
                val === 'queue'
                    ? rawQueue.push({...doc.data(), docRef: doc.ref})
                    : val === 'development'
                        ? rawDevelopment.push({...doc.data(), docRef: doc.ref})
                        : rawDone.push({...doc.data(), docRef: doc.ref})
            })
        }
        setQueue(rawQueue.reverse())
        setDevelopment(rawDevelopment.reverse())
        setDone(rawDone.reverse())
    })

    /**
     * Запрашивает определенную коллекцию задач с определенным статусом
     */
    const [fetchOne, loadingOne, errorOne] = useFetch(async (which) => {
        const arr = [];
        if (statuses.indexOf(which) === -1) return
        const querySnapshot = await getDocs(query(collection(db, which), orderBy('createdAt')))
        querySnapshot.forEach((doc) => {
            arr.push({...doc.data(), docRef: doc.ref})
        })
        switch (which) {
            case 'queue':
                setQueue(arr.reverse())
                break;
            case 'development':
                setDevelopment(arr.reverse())
                break;
            case 'done':
                setDone(arr.reverse())
                break;
            default:
                return
        }
    })

    useEffect(
        /**
         * При первом рендере получает данные с сервера
         * и устанавливает слушатель события beforeUnload на window
         * При размонтировании убирает его
         * @return {function(): void}
         */
        () => {
            fetching();
            /**
             * Проверяет, идет ли сейчас синхронизация с сервером
             * и, если да, предупреждает пользователя при попытке выхода/перезагрузки
             * @param e {BeforeUnloadEvent}
             */
            const unloadCallback = (e) => {
                if (sync.current) {
                    e.preventDefault();
                    e.returnValue = "";
                    return "";
                }
            };

            window.addEventListener("beforeunload", unloadCallback);
            return () => window.removeEventListener("beforeunload", unloadCallback);
    }, [])

    /**
     * Убирает элемент массива, индекс которого равен 'index'. Возвращает новый массив
     * @param arr {Array} Массив задач
     * @param index {number} Индекс элемента, который надо убрать
     * @return {*[]}
     */
    const filterByIndex = (arr, index) => [...arr.filter((item, i) => i !== index)]

    /**
     * Формирует подходящий объект для firestore
     * @param obj {Object} Данные из которых формируется новый объект
     * @param newStatus {string} Может быть пустой строкой или 'done'. Если 'done', то указывает,
     * что данные формируются для списка завершенных задач (со статусом 'done')
     * @return {{createdAt, doneAt: (string|*|string), name, description, deadline}}
     */
    const formatDataForFirebase = (obj, newStatus = '') => ({
        name: obj.name,
        description: obj.description,
        deadline: obj.deadline,
        createdAt: obj.createdAt,
        doneAt: obj.doneAt
            ? newStatus
                ? obj.doneAt
                : ''
            : newStatus === 'done'
                ? dayjs(new Date()).format('HH:mm YYYY/MM/DD')
                : '',
    })

    /**
     * Удаляет задачу на сервере и локально
      * @param {number} index индекс задачи в массиве, которую надо удалить.
     * @param {string} status статус, который имеет задача.
     */
    const deleteCard = async (index, status) => {
        sync.current = true;

        switch (status) {
            case 'queue':
                setQueue(prevState => filterByIndex(prevState, index))
                await deleteDoc(queue[index].docRef)
                break;
            case 'development':
                setDevelopment(prevState => filterByIndex(prevState, index))
                await deleteDoc(development[index].docRef)
                break;
            case 'done':
                setDone(prevState => filterByIndex(prevState, index))
                await deleteDoc(done[index].docRef)
                break;
            default:
                return
        }
        sync.current = false;
    }

    /**
     * Изменяет задачу. Если она новая, то добавляет ее на сервер
     * @param index {number} Индекс элемента в массиве задач, который надо изменить
     * @param obj {Object} Объект новых данных для обновления задачи
     * @param status {string} Может быть 'queue', 'development', 'done'
     * Указывает статус задачи, которая вызвала функцию
     * @return {Promise<void>}
     */
    const editCard = async (index, obj, status) => {
        sync.current = true;

        /**
         * Объект для обновления данных на сервере
         * @type {{name, description, deadline}}
         */
        const data = {
            name: obj.name,
            deadline: obj.deadline,
            description: obj.description,
        }

        /**
         * Возвращает новый массив задач, с измененной задачей.
         * @param prevData {Array} Предыдущий массив задач
         * @return {*}
         */
        const editItem = (prevData) => prevData.map((item, i) =>
            i === index
                ? {...item, ...data}
                : item
        )

        switch (status) {
            case 'queue':
                setQueue(prevState => editItem(prevState))
                // проверяет существование ссылки на удаленный документ
                queue[index].docRef
                    // обновляет задачу на сервере
                    ? await updateDoc(queue[index].docRef, data)
                    // добавляет новую задачу на сервер
                    : await addDoc(collection(db, 'queue'), formatDataForFirebase(obj))
                break;
            case 'development':
                setDevelopment(prevState => editItem(prevState))
                development[index].docRef
                    ? await updateDoc(development[index].docRef, data)
                    : await addDoc(collection(db, 'development'), formatDataForFirebase(obj))
                break;
            case 'done':
                setDone(prevState => editItem(prevState))
                done[index].docRef
                    ? await updateDoc(done[index].docRef, data)
                    : await addDoc(collection(db, 'done'), formatDataForFirebase(obj))
                break;
            default:
        }
        sync.current = false;
    }

    /**
     * Добавляет новую задачу в массив состояния в зависимости от статуса
     * @param status {string} Может быть 'queue', 'development'. Статус новой задачи.
     */
    const addCard = (status) => {
        if (status === 'queue') {
            setQueue(prevState => [{
                name: '',
                deadline: '',
                description: '',
                createdAt: (new Date()).valueOf(),
            }, ...prevState])
        } else {
            setDevelopment(prevState => [{
                name: '',
                deadline: '',
                description: '',
                createdAt: (new Date()).valueOf(),
            }, ...prevState])
        }
    }

    /**
     * Изменяет статус задачи и перемещает ее в соответствующий массив задач.
     * Удаляет задачу из коллекции сервера с текущим статусом и добавляет в другую.
     * @param index {number} Индекс задачи
     * @param prevStatus {string} Текущий статус задачи. Может быть 'queue', 'development', 'done'.
     * @param newStatus {string} Новый статус задачи. Может быть 'queue', 'development', 'done'.
     * @return {Promise<void>}
     */
    const changeStatus = async (index, prevStatus, newStatus) => {
        sync.current = true;

        /**
         * Удаляет задачу с текущей коллекции сервера и добавляет ее в другую.
         * После, запрашивает обновленную коллекцию, куда была добавлена задача.
         * Для определения, что и как изменять, исходя из предыдущего статуса(prevStatus)
         * сравнивает новый статус(newStatus) с ifStatus
         * @param ifStatus {string} Статус в if блоке.
         * @param elseStatus {string} Статус в else блоке.
         * @param state {React.ComponentState.Array} Массив состояния в котором находится изменяемая задача.
         * @param ifSet {React.SetStateAction} setStateAction в if блоке.
         * @param elseSet {React.SetStateAction} setStateAction в else блоке.
         * @return {Promise<void>}
         */
        const changeHandler = async (ifStatus, elseStatus, state, ifSet, elseSet) => {
            if (newStatus === ifStatus) {
                ifSet(prevState => [state[index], ...prevState])
                await deleteDoc(state[index].docRef)
                await addDoc(collection(db, ifStatus), formatDataForFirebase(state[index]))
                await fetchOne(ifStatus)
            } else {
                elseSet(prevState => [state[index], ...prevState])
                await deleteDoc(state[index].docRef)
                await addDoc(
                    collection(db, elseStatus),
                    formatDataForFirebase(
                        state[index],
                        elseStatus === 'done' ? 'done' : ''))
                await fetchOne(elseStatus)
            }
        }
        switch (prevStatus) {
            case 'queue':
                setQueue(prevState => filterByIndex(prevState, index))
                await changeHandler('development', 'done', queue, setDevelopment, setDone)
                break;
            case 'development':
                setDevelopment(prevState => filterByIndex(prevState, index))
                await changeHandler('queue', 'done', development, setQueue, setDone)
                break;
            case 'done':
                setDone(prevState => filterByIndex(prevState, index))
                await changeHandler('development', 'queue', done, setDevelopment, setQueue)
                break;
            default:
        }
        sync.current = false;
    }

    if (loading) return <Loading />
    if (error) return <div>{error}</div>

    return (
        <div className="todoPage">
            <CardList
                cards={queue}
                status='queue'
                changeStatus={changeStatus}
                deleteCard={deleteCard}
                editCard={editCard}
                addCard={addCard}
            />
            <CardList
                cards={development}
                status="development"
                changeStatus={changeStatus}
                deleteCard={deleteCard}
                editCard={editCard}
                addCard={addCard}
            />
            <CardList
                cards={done}
                status="done"
                changeStatus={changeStatus}
                deleteCard={deleteCard}
                editCard={editCard}
                addCard={addCard}
            />
        </div>
    );
};

export default Main;