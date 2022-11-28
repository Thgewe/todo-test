import React, {memo, useEffect, useRef, useState} from 'react';
import './filesBlock.less';
import { ref, deleteObject, listAll, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {fireStorage} from "../../firebase";

/**
 * Компонент, отвечающий за взаимодействие с файлами
 * @type {React.NamedExoticComponent<{readonly folderPath?: *}>}
 */
const FilesBlock = memo(({folderPath}) => {

    /**
     * Референс на поле выбора файлов
     * @type {React.MutableRefObject<undefined>}
     */
    const fileInput = useRef();

    /**
     * Файлы, полученные с сервера
     */
    const [files, setFiles] = useState([]);

    /**
     * Референс на элемент ссылку, который используется для скачивания файла.
     * @type {React.MutableRefObject<undefined>}
     */
    const downloadLink = useRef();

    /**
     * Загружает файлы на сервер.
     * Перебирает выбранные файлы и выгружает каждый на сервер. В случае успешной выгрузки,
     * запрашивает новый список файлов с сервера.
     */
    const upload = () => {
        for (let file of fileInput.current.files) {
            const filePathRef = ref(fireStorage, folderPath + '/' + file.name);
            const uploadTask = uploadBytesResumable(filePathRef, file)

            uploadTask.on('state_changed',
                (snapshot) => {
                    // uploading
                },
                (error) => {
                    // error
                    alert(error.message)
                },
                () => {
                    // completed successfully
                    getStorageFiles()
                }
                )
        }
    }

    /**
     * Запрашивает файлы с сервера, из пришедших данных формирует массив подходящих объектов
     * и устанавливает его в 'files'
     */
    const getStorageFiles = () => {
        const pathRef = ref(fireStorage, folderPath + '');

        listAll(pathRef).then((res) => {
            if (res.items.length) {
                const items = []
                for (let file of res.items) {
                    items.push({path: file.fullPath, name: file.name})
                }
                setFiles(items)
            }
        })
    }

    /**
     * Срабатывает при нажатии на кнопку удаления файла. Удаляет его с сервера и из 'files'.
     * @param path {string} Полный путь до файла на сервере.
     */
    const onDeleteFile = (path) => {
        const pathRef = ref(fireStorage, path)

        deleteObject(pathRef).then(() => {
            setFiles(prevState => [...prevState.filter((file) => file.path !== path)])
        }).catch((error) => {
            alert(error.message)
        })
    }

    /**
     * Срабатывает при клике по файлу. Скачивает файл с сервера.
     * @param e {MouseEvent<HTMLDivElement>}
     */
    const onFirestoreFileClick = (e) => {
        const storageFileRef = ref(fireStorage, e.currentTarget.dataset.path)

        getDownloadURL(storageFileRef).then((url) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = (event) => {
                const blob = xhr.response;
                const blobUrl = window.URL.createObjectURL(blob);
                downloadLink.current.setAttribute("href", blobUrl)
                downloadLink.current.click();
                window.URL.revokeObjectURL(blobUrl);
            };
            xhr.open('GET', url);
            xhr.send();
        })
    }

    useEffect(() => {
        getStorageFiles()
    }, [])

    return (
        <div className="files">

            {/* files input */}
            <div className="files__input">
                <a href="" ref={downloadLink} download></a>
                <label className="files__fake">
                    <input
                        tabIndex={-1}
                        type="file"
                        multiple="multiple"
                        ref={fileInput}
                        onChange={upload}
                    />
                </label>
                <div>Upload files</div>
            </div>

            {/* if files exist on the server, it shows them */}
            {files.length ?
                <>
                    <div>Uploaded files:</div>
                    <div className="files__storage">
                        {files.map((file) =>
                            <div
                                key={file.name}
                                className="files__file"
                            >
                                <div
                                    className="files__download"
                                    data-path={file.path}
                                    title={'download ' + file.name}
                                    onClick={(e) => onFirestoreFileClick(e)}
                                >{file.name}</div>
                                <div
                                    className="files__delete"
                                    title={'delete file ' + file.name}
                                    onClick={() => onDeleteFile(file.path)}
                                ></div>
                            </div>
                        )}
                    </div>
                </>
                : null
            }
        </div>
    );
});

export default FilesBlock;