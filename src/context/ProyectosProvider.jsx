import { useState, useEffect, createContext } from "react"
import clienteAxios from "../config/clienteAxios"
import { useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import io from "socket.io-client"

let socket

const ProyectosContext = createContext()

const ProyectosProvider = ({children}) => {

    const [proyectos, setProyectos] = useState([])
    const [alerta, setAlerta] = useState({})
    const [proyecto, setProyecto] = useState({})
    const [cargando, setCargando] = useState(false)
    const [modalFormularioTarea, setModalFormularioTarea] = useState(false)
    const [tarea, setTarea] = useState({})
    const [modalEliminarTarea, setModalEliminarTarea] = useState(false)
    const [colaborador, setColaborador] = useState({})
    const [modalEliminarColaborador, setModalEliminarColaborador] = useState(false)
    const [buscador, setBuscador] = useState(false)

    const navigate = useNavigate()
    const { auth } = useAuth()

    // Obtener proyectos del usuario
    useEffect(() => {
        const obtenerProyectos = async () => {
            try {
                const token = localStorage.getItem("token")
                if(!token) return

                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }

                const { data } = await clienteAxios("/proyectos", config)
                setProyectos(data)

            } catch (error) {
                
            }
        }
        obtenerProyectos()
    }, [auth])

    // Conexión hacia socket io
    useEffect(() => {
        socket = io(import.meta.env.VITE_BACKEND_URL)
    }, [])
    

    const mostrarAlerta = alerta => {
        setAlerta(alerta)
        setTimeout(() => {
            setAlerta({})
        }, 5000);
    }

    const submitProyecto = async proyecto => {
        if(proyecto.id){
            await editarProyecto(proyecto)
        } else {
            await nuevoProyecto(proyecto)
        }
    }

    // Nuevo proyecto
    const nuevoProyecto = async proyecto => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.post("/proyectos", proyecto, config)
            
            setProyectos([...proyectos, data])

            setAlerta({
                msg: "Proyecto creado exitosamente",
                error: false
            })

            setTimeout(() => {
                setAlerta({})
                navigate("/proyectos")
            }, 3000);

        } catch (error) {
            console.log(error.response.data)
        }
    }

    // Editar proyecto
    const editarProyecto = async proyecto => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.put(`/proyectos/${proyecto.id}`, proyecto, config)
            
            // Sincronizar el state
            const proyectosActualizados = proyectos.map(
                proyectoState => proyectoState._id === data._id ?
                data : proyectoState
            )
            setProyectos(proyectosActualizados)

            // Mostrar la alerta y redireccionar
            setAlerta({
                msg: "Proyecto actualizado correctamente",
                error: false
            })

            setTimeout(() => {
                setAlerta({})
                navigate("/proyectos")
            }, 3000);

        } catch (error) {
            console.log(error.response.data)
        }
    }

    // Obtener un proyecto por su id
    const obtenerProyecto = async id => {
        setCargando(true)
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios(`/proyectos/${id}`, config)
            setProyecto(data)
            setAlerta({})

        } catch (error) {
            navigate("/proyectos")
            setAlerta({
                msg: error.response.data.msg,
                error: true
            })
            setTimeout(() => {
                setAlerta({})
            }, 3000);
        }
        setCargando(false)
    }

    // Eliminar un proyecto
    const eliminarProyecto = async id => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.delete(`/proyectos/${id}`, config)
            console.log(data)

            // Sincronizar el state
            const proyectosActualizados = proyectos.filter(proyectoState => proyectoState._id !== id)
            setProyectos(proyectosActualizados)

            // Mostrar la alerta y redireccionar
            setAlerta({
                msg: data.msg,
                error: false
            })

            setTimeout(() => {
                setAlerta({})
                navigate("/proyectos")
            }, 3000)
        } catch (error) {
            console.log(error.response.data)
        }
    }

    // Mostrar y ocultar modal de formulario tarea
    const handleModalTarea = () => {
        setModalFormularioTarea(!modalFormularioTarea)
        setTarea({})
    }

    // Crear nueva tarea o editar una existente
    const submitTarea = async tarea => {

        if(tarea?.id){
            await editarTarea(tarea)
        } else {
            await crearTarea(tarea)
        }
    }

    const crearTarea = async tarea => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.post("/tareas", tarea, config)

            setAlerta({})
            setModalFormularioTarea(false)

            //SOCKET IO
            socket.emit("nueva tarea", data)

        } catch (error) {
            console.log(error.response.data)
        }
    }

    const editarTarea = async tarea => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.put(`/tareas/${tarea.id}`, tarea, config)

            setAlerta({})
            setModalFormularioTarea(false)

            // SOCKET
            socket.emit("actualizar tarea", data)
        } catch (error) {
            console.log(error.response.data)
        }
    }

    const handleModalEditarTarea = tarea => {
        setTarea(tarea)
        setModalFormularioTarea(true)
    }

    // Eliminar tarea
    const handleModalEliminarTarea = tarea => {
        setTarea(tarea)
        setModalEliminarTarea(!modalEliminarTarea)
    }

    const eliminarTarea = async () => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.delete(`/tareas/${tarea._id}`, config)
            setAlerta({
                msg: data.msg,
                error: false
            })

            setModalEliminarTarea(false)

            // socket
            socket.emit("eliminar tarea", tarea)

            setTarea({})

            setTimeout(() => {
                setAlerta({})
            }, 3000)

        } catch (error) {
            console.log(error.response.data)
        }
    }

    // Agregar colaborador
    const submitColaborador = async email => {

        if(!email){
            setColaborador({})
            return
        }

        setCargando(true)
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.post("/proyectos/colaboradores", {email}, config)
            setColaborador(data)

            setAlerta({})

        } catch (error) {
            setAlerta({
                msg: error.response.data.msg,
                error: true
            })
            setColaborador({})
        }
        setCargando(false)
    }

    const agregarColaborador = async email => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.post(`/proyectos/colaboradores/${proyecto._id}`, email, config)
        
            setAlerta({
                msg: data.msg,
                error: false
            })
            setColaborador({})

            setTimeout(() => {
                setAlerta({})
            },3000)

        } catch (error) {
            setAlerta({
                msg: error.response.data.msg, 
                error: true
            })
        }
    }

    const handleModalEliminarColaborador = colaborador => {
        setModalEliminarColaborador(!modalEliminarColaborador)
        setColaborador(colaborador)
    }

    const eliminarColaborador = async () => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            
            const { data } = await clienteAxios.post(
                `/proyectos/eliminar-colaborador/${proyecto._id}`, 
                {id: colaborador._id}, 
                config
            )

            const proyectoActualizado = {...proyecto}
            proyectoActualizado.colaboradores = proyectoActualizado.colaboradores.filter(
                colaboradorState => colaboradorState._id !== colaborador._id
            )
            setProyecto(proyectoActualizado)
        
            setAlerta({
                msg: data.msg,
                error: false
            })
            setColaborador({})
            setModalEliminarColaborador(false)

            setTimeout(() => {
                setAlerta({})
            },3000)

        } catch (error) {
            console.log(error.response.data)
        }
    }

    const completarTarea = async id => {
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.post(`/tareas/estado/${id}`, {}, config)
            
            setTarea({})
            setAlerta({})

            // SOCKET
            socket.emit("cambiar estado", data)


        } catch (error) {
            console.log(error.response.data)
        }
    }


    // Buscador
    const handleBuscador = () => {
        setBuscador(!buscador)
    }



    // Socket io
    const submitTareasProyecto = (tarea) => {
        //Agrega la tarea al state
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.tareas = [...proyectoActualizado.tareas, tarea]
        setProyecto(proyectoActualizado)
    }

    const eliminarTareaProyeto = tarea => {
        // Actualizar el DOM
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.tareas = proyectoActualizado.tareas.filter(tareaState =>
            tareaState._id !== tarea._id    
        )
        setProyecto(proyectoActualizado)
    }

    const actualizarTareaProyecto = tarea => {
        // Actualizar el DOM
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.tareas = proyectoActualizado.tareas.map( tareaState => 
            tareaState._id === tarea._id ? tarea : tareaState
        )
        setProyecto(proyectoActualizado)
    }

    const cambiarEstadoTarea = tarea => {
        const proyectoActualizado = {...proyecto}
        proyectoActualizado.tareas = proyectoActualizado.tareas.map( tareaState => 
            tareaState._id === tarea._id ? tarea : tareaState    
        )
        setProyecto(proyectoActualizado)
    }


    const cerrarSesionProyectos = () => {
        setProyecto({})
        setProyectos([])
        setAlerta({})
    }



    return(
        <ProyectosContext.Provider
            value={{
                proyectos,
                alerta,
                proyecto,
                cargando,
                modalFormularioTarea,
                tarea,
                modalEliminarTarea,
                colaborador,
                modalEliminarColaborador,
                buscador,
                mostrarAlerta,
                submitProyecto,
                obtenerProyecto,
                eliminarProyecto,
                handleModalTarea,
                submitTarea,
                handleModalEditarTarea,
                handleModalEliminarTarea,
                eliminarTarea,
                submitColaborador,
                agregarColaborador,
                handleModalEliminarColaborador,
                eliminarColaborador,
                completarTarea,
                handleBuscador,
                submitTareasProyecto,
                eliminarTareaProyeto,
                actualizarTareaProyecto,
                cambiarEstadoTarea,
                cerrarSesionProyectos
            }}
        >
            {children}
        </ProyectosContext.Provider>
    )
}

export {
    ProyectosProvider
}

export default ProyectosContext