import React, {memo, useRef, useState} from 'react';
import dayjs from "dayjs";
import './card.less';
import {dateFormat} from "../../utils/constants";
import FilesBlock from "../FilesBlock/FilesBlock";

/**
 * Компонент задачи
 * @type {React.NamedExoticComponent<{readonly descr?: *, readonly doneAt?: *, readonly createdAt?: *, readonly name?: *, readonly index?: *, readonly changeStatus?: *, readonly isNew?: *, readonly deadline?: *, readonly deleteCard?: *, readonly status?: *, readonly editCard?: *}>}
 */
const Card = memo(({
                  deadline,
                  name,
                  descr,
                  doneAt,
                  status,
                  changeStatus,
                  index,
                  deleteCard,
                  editCard,
                  isNew,
                  createdAt,
}) => {


    // Состояние, которое определяет, идет ли сейчас редактирование задачи.
    // Если задача новая, то изначальное значение true
    const [editing, setEditing] = useState(isNew)
    const nameRef = useRef(),
        descrRef = useRef(),
        deadlineRef = useRef()

    /**
     * Срабатывает когда пользователь нажал на кнопку редактирования задачи.
     * Если идет редактирование(editing === true), то проверяет валидацию поля 'deadline',
     * потом вызывает функцию редактирования(editCard). В конце переключает 'editing' на противоположное.
     * Если нет, то только переключает 'editing'.
     */
    const onEdited = () => {
        if (editing) {
            if (!deadlineRef.current.value) {
                alert("deadline must be specified")
                return
            } else if (!dayjs(deadlineRef.current.value, dateFormat).isValid()) {
                alert("deadline is incorrect")
                return
            }
            editCard(index, {
                name: nameRef.current.value,
                deadline: deadlineRef.current.value,
                description: descrRef.current.value,
                createdAt: createdAt,
            }, status)
        }
        setEditing(prevState => !prevState)
    }

    /**
     * Срабатывает при нажатии пользователя на кнопку отмены изменений.
     * Проверяет состояние редактирования и, если 'false', возвращает void.
     * Если задача новая, вызывает функцию удаления этой задачи и возвращает void.
     * Если функция не является новой, то через 100 миллисекунд переключает состояние редактирования на 'false'
     * и возвращает исходные данные в поля. Задержка установлена потому что изменение состояния без нее
     * приводит к срабатыванию onClick ивента на кнопке отвечающей за удаление задачи.
     */
    const onDiscard = () => {
        if (!editing) return
        if (isNew) {
            deleteCard(index, status)
            return
        }
        setTimeout(() => {
            setEditing(false)
            nameRef.current.value = name;
            deadlineRef.current.value = deadline;
            descrRef.current.value = descr;
        }, 100)
    }

    return (
        <div className={
            'card' + (status === 'development'
                ? ' card--dev'
                : status === 'done'
                    ? ' card--done'
                    : '') + (editing ? ' card--editing' : '')
        }>

            {/* name field */}
            <label htmlFor="cardName" className="card__label">Title</label>
            <input
                id="cardName"
                className="card__name"
                disabled={!editing}
                defaultValue={name}
                ref={nameRef}
            />

            {/* description field */}
            <label htmlFor="cardDescr" className="card__label">Description</label>
            <textarea
                id="cardDescr"
                className="card__descr"
                defaultValue={descr}
                disabled={!editing}
                ref={descrRef}
            />

            {/* files input */}
            <FilesBlock folderPath={createdAt}/>

            {/* deadline field*/}
            <div className="card__deadline">
                <label htmlFor="cardDeadline" className="card__label">Deadline:</label>
                <input
                    id="cardDeadline"
                    className="card__time"
                    placeholder={dateFormat}
                    defaultValue={deadline}
                    disabled={!editing}
                    ref={deadlineRef}
                />
            </div>

            {/* completion time & is expired? */}
            <div className={"card__done" + (
                (doneAt
                    ? dayjs(doneAt, dateFormat).diff(deadline) > 0
                    : dayjs(deadline, dateFormat).diff(new Date()) < 0
                ) ? " card__done--expired" : ''
            )}>
                <div className="card__label">Done at:</div>
                <div className="card__at">
                    {doneAt
                        ? doneAt
                        : '--:-- ----/--/--'
                    }
                </div>
                <span>Expired</span>
            </div>

            {/* task control buttons */}
            <div className="card__buttons">

                {/* changes the status of a task */}
                <select
                    className="card__select"
                    value={status}
                    disabled={editing}
                    onChange={(e) => {changeStatus(index, status, e.target.value)}}
                >
                    <option value="queue">Queue</option>
                    <option value="development">Development</option>
                    <option value="done">Done</option>
                </select>

                {/* enables edit mode */}
                <div
                    className="card__edit"
                    title="edit"
                    onClick={() => onEdited()}
                ></div>

                {/* deletes a task or discards changes */}
                <label
                    className="card__delete"
                    title={editing ? 'discard' : "delete"}
                    onClick={() => {onDiscard()}}
                >
                    <input
                        type="checkbox"
                        checked={editing ? false : undefined}
                        tabIndex={-1}
                        onBlur={(e) => {setTimeout(() => {e.target.checked = false}, 100)}}
                    />

                    {/* deletion confirmation */}
                    <div className="card__popup">
                        <div onClick={() => deleteCard(index, status)}>Yes</div>
                        <div>No</div>
                    </div>
                </label>
            </div>
        </div>
    );
});

export default Card;