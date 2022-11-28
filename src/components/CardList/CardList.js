import React, {memo} from 'react';
import './cardList.less';
import Card from "../Card/Card";
import { useCallback } from "react";

/**
 * Список задач
 * @type {React.NamedExoticComponent<{readonly cards?: *, readonly addCard?: *, readonly changeStatus?: *, readonly deleteCard?: *, readonly status?: *, readonly editCard?: *}>}
 */
const CardList = memo(({cards, status, changeStatus, deleteCard, editCard, addCard}) => {

    /**
     * Мемоизированная функция изменения статуса задачи
     * @type {function(...[*]): *}
     */
    const memoChangeStatus = useCallback((...args) => changeStatus(...args), [cards])

    /**
     * Мемоизированная функция удаления задачи
     * @type {function(...[*]): *}
     */
    const memoDeleteCard = useCallback((...args) => deleteCard(...args), [cards])

    /**
     * Мемоизированная функция изменения задачи
     * @type {function(...[*]): *}
     */
    const memoEditCard = useCallback((...args) => editCard(...args), [cards])

    /**
     * Мемоизированная функция добавления новой задачи
     * @type {function(...[*]): *}
     */
    const memoAddCard = useCallback((...args) => addCard(...args), [])

    return (
        <div className="cardList">
            {
                status === 'queue'
                    ? <h3 className="cardList__headline">Queue</h3>
                    : status === 'development'
                        ? <h3 className="cardList__headline">Development</h3>
                        : <h3 className="cardList__headline">Done</h3>
            }
            {status === 'done'
                ? <button className="cardList__add" disabled={true}>Add</button>
                : <button className="cardList__add" onClick={() => memoAddCard(status)}>Add</button>
            }
            {cards.map((card, i) =>
                <Card
                    key={card.createdAt}
                    deadline={card.deadline}
                    descr={card.description}
                    doneAt={card?.doneAt}
                    name={card.name}
                    status={status}
                    index={i}
                    changeStatus={memoChangeStatus}
                    deleteCard={memoDeleteCard}
                    editCard={memoEditCard}
                    isNew={!!!card.docRef}
                    createdAt={card.createdAt}
                />
            )}
        </div>
    );
});

export default CardList;