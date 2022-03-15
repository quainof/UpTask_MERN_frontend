import { formatearFecha } from "../helpers/formatearFecha"
import useProyectos from "../hooks/useProyectos"
import useAdmin from "../hooks/useAdmin"

const Tarea = ({tarea}) => {

    const { handleModalEditarTarea, handleModalEliminarTarea, completarTarea } = useProyectos()
    const admin = useAdmin()
    const { nombre, descripcion, prioridad, fechaEntrega, estado, _id} = tarea

    return (
        <div className="border-b p-5 flex justify-between items-center">

            <div className="flex flex-col items-start">
                <p className="text-xl mb-1">{nombre}</p>
                <p className="text-sm mb-1 text-gray-500 uppercase">{descripcion}</p>
                <p className="text-sm mb-1">{formatearFecha(fechaEntrega)}</p>
                <p className="text-gray-600 mb-1">Prioridad: {prioridad}</p>
                { estado && <p className="text-xs bg-green-600 uppercase p-1 rounded-lg text-white"
                >Completada por: {tarea.completado.nombre}</p>}
            </div>

            <div className="flex gap-2 flex-col lg:flex-row">
                { admin && (
                    <button
                        className="bg-indigo-600 px-4 py-3 text-white uppercase text-sm rounded-lg font-bold"
                        onClick={ () => handleModalEditarTarea(tarea)}
                    >Editar</button>
                )}


                <button
                    className={`px-4 py-3 text-white uppercase text-sm rounded-lg font-bold ${estado ? "bg-sky-600" : "bg-gray-600"}`}
                    onClick={ () => completarTarea(_id) }
                >{estado ? "Completa" : "Incompleta"}</button>


                { admin && (
                    <button
                        className="bg-red-600 px-4 py-3 text-white uppercase text-sm rounded-lg font-bold"
                        onClick={ () => handleModalEliminarTarea(tarea)}
                    >Eliminar</button>
                )}
            </div>

        </div>
    )
}

export default Tarea