import React, { useEffect, useState } from 'react';
import "./GestionClientes.css";
import Tabla from '../../components/Tabla/Tabla';
import Add from '../../components/Add/Add';
import axios from 'axios';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import jwtDecode from 'jwt-decode';

const MySwal = withReactContent(Swal);

function GestionClientes() {

  const token = localStorage.getItem("jwt");

  if (!token) {
    window.location.href = '/login';
    return null;
}

  const payload = jwtDecode(token);
  const idUsuario = payload.idUser;
  
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      id_usuario: idUsuario
    },
  };

  const [planesOptions, setPlanesOptions] = useState([]);
  const [usuariosOptions, setUsuariosOptions] = useState([]);
  const [clientes, setClietnes] = useState([]);

  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger'
    },
    buttonsStyling: false
  })
  const obtenerPlanesOptions = () => {
    axios.get('http://localhost:3000/api/planes',config)
      .then(response => {
        if (response.status === 200) {
          const opciones = response.data.map(opcion => ({
            value: opcion.id_plan,
            label: opcion.nombre_plan,
          }));
          setPlanesOptions(opciones);
        } else {
          console.error('Error al obtener las opciones de planes:', response);
        }
      })
      .catch(error => {
        console.error('Error al obtener las opciones de planes:', error);
      });
  };
  useEffect(() => {
    obtenerPlanesOptions();
  }, []);

  const agregarCliente = (nuevoCliente) => {
    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas crear el cliente?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {
        nuevoCliente.id_plan = nuevoCliente.plan;
        nuevoCliente.id_usuario = '1';
        nuevoCliente.estado_usuario = nuevoCliente.estadousuario;
        axios.post('http://localhost:3000/api/clientes', nuevoCliente,config)
          .then(response => {
            console.log('Respuesta a la solicitud:', response);
            if (response.status === 200) {
              cambiarEstadoModal1(false);
              MySwal.fire('¡Exito!', 'Has creado el cliente', 'success');
              window.location.reload();
            } else {
              MySwal.fire('Error', 'Error al crear el cliente', 'error');
            }
          })
          .catch(error => {
            MySwal.fire('Error', 'Error al crear el cliente', error);
          });
      } else {
        response.dismiss == Swal.DismissReason.cancel;
        window.location.reload();
      }
    });
  };
  const columnas = [
    { field: "id", headerName: "ID", width: 40, editable: false },
    {
      field: 'nombre',
      headerName: 'Nombre',
      width: 150,
      editable: true,
    },

    {
      field: 'ubicacion',
      headerName: 'Ubicacion',
      width: 150,
      editable: true,
    },

    {
      field: 'telefono',
      headerName: 'Telefono',
      width: 150,
      editable: true,
    },

    {
      field: 'correo',
      headerName: 'Correo',
      width: 150,
      editable: true,
    },

    {
      field: 'plan',
      headerName: 'Plan',
      description: 'Plan del cliente',
      width: 160,
      type: 'select',
      options: planesOptions,
      editable: true,

    },
    {
      field: 'estadousuario',
      headerName: 'Estado',
      description: 'Usuario activo o inactivo',
      width: 160,
      type: 'select',
      editable: true,
      options: [{
        value: 1,
        label: "Cliente Activo",
      },
      {
        value: 2,
        label: "Cliente Inactivo",
      },
      ],
      cellClassName: (params) => {
        if (params.value === 1) { //aqui se evalua las opciones que son seleccionadas del select
          return 'estado-activo';
        } else if (params.value === 2) {
          return 'estado-inactivo'; // a los return les aplicamos los estilos css en tabla.scss
        }
        return '';
      },

    },
  ];


  const [filas, setFilas] = useState([])
  const [estadoModal1, cambiarEstadoModal1] = useState(false); //estado para el modal de agregar 
  const [showModal, setShowModal] = useState(false);   //estado para el modal de editar

  const obtenerClientes = () => {
    axios.get('http://localhost:3000/api/clientes',config)
      .then(response => {
        const clientesConId = response.data.map(cliente => ({
          id: cliente.id_cliente,
          nombre: cliente.nombre,
          ubicacion: cliente.ubicacion,
          telefono: cliente.telefono,
          correo: cliente.correo,
          plan: cliente.id_plan,
          usuario: cliente.id_usuario,
          estadousuario: cliente.estado_usuario,
        }));
        setClietnes(clientesConId);
        setFilas(clientesConId);
      })
      .catch(error => {
        console.error('Error al obtener clientes', error);
      });
  };

  useEffect(() => {
    obtenerClientes();
  }, []);

  const handleEditRow = (id) => {
    console.log("selecciono la fila con" + id + "en gestion de clientes");
    setCamposEditados(filas.id);
    setShowModal(true);
  };

  const handleEditClient = (editedClient) => {
    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas editar el cliente?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {
        const propertyMap = {
          id: 'id_cliente',
          nombre: 'nombre',
          ubicacion: 'ubicacion',
          telefono: 'telefono',
          correo: 'correo',
          estadousuario: 'estado_usuario',
          plan: 'id_plan',
          usuario: 'id_usuario',
        };

        const requestBody = {};

        for (const key in editedClient) {
          if (key in propertyMap) {
            requestBody[propertyMap[key]] = editedClient[key];
          } else {
            requestBody[key] = editedClient[key];
          }
        }
        axios
          .put(`http://localhost:3000/api/clientes/${editedClient.id}`, requestBody, config)
          .then((response) => {
            if (response.status === 200) {
              obtenerClientes();
              setShowModal(false);
              Swal.fire('¡Exito!', 'Has editado el cliente correctamente', 'success')
              window.location.reload();
            } else {
              Swal.fire('Error', 'Error al editar el cliente', 'error')
            }
          })
          .catch((error) => {
            Swal.fire('Error', 'Error al editar el cliente', error)
          });
      } else {
        response.dismiss === Swal.DismissReason.cancel;
        window.location.reload();
      }
    })
  };

  const handleDeleteClick = (idCliente) => {
    axios.patch(`http://localhost:3000/api/clientes/${idCliente}`,config)
      .then(response => {
        if (response.status === 200) {
          obtenerClientes();
          MySwal.fire('¡Exito!', 'Cliente eliminado correctamente', 'success')
          window.location.reload();
        } else {
          Swal.fire('Error', 'Error al eliminar el cliente', 'error');
        }
      })
      .catch(error => {
        console.error('Error al eliminar el cliente:', error);
      });
  };

  const handleDeleteRow = (id) => {
    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas eliminar el cliente?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {
        console.log("borrandofila" + id + "en gestion de clientes");
        const nuevasFilas = filas.filter((fila) => fila.id !== id);
        setFilas(nuevasFilas);
        handleDeleteClick(id);
      } else {
        response.dismiss === Swal.DismissReason.cancel
        setFilas(filas);
      }
    })

  }

  const [camposEditados, setCamposEditados] = useState({});  // aca estaba definiendo para la actualizacion de la fila de la tabla 

  const handleChange = (event) => {
    const { id, value } = event.target;
    setCamposEditados({ ...camposEditados, [id]: value })
  }
  return (
    <div className="contenedor-gestion">
      <div className="titulo-clientes">
        <h1>Gestion de Clientes</h1>
        <hr />
      </div>
      <div className='contenedor-busqueda'>
        <button className='boton-clientes' onClick={() => cambiarEstadoModal1(!estadoModal1)}>Agregar</button>
      </div>
      <Tabla
        columns={columnas}
        rows={filas}
        actions
        handleEditClick={handleEditRow}
        handleDeleteRow={handleDeleteRow}
        handleEditClient={handleEditClient}

      />

      <Add
        estado={estadoModal1}
        cambiarEstado={cambiarEstadoModal1}
        titulo="Agregar Cliente"
        campos={columnas.map(({ headerName: campo, field: idCampo, type, options }) => {
          if (type === 'select') {
            return {
              campo,
              idCampo,
              typeCampo: 'select',
              options: options,
            };
          }
          else {
            return { campo, idCampo, typeCampo: 'text' };
          }
        })}

        filas={filas}
        setFilas={setFilas}
        onGuardar={agregarCliente}

      />

      <Add
        estado={showModal}
        cambiarEstado={setShowModal}
        titulo="Editar Cliente"
        campos={columnas.map(({ headerName: campo, field: idCampo, typeCampo }) => {
          return { campo, idCampo, typeCampo };
        })}
        camposEditados={camposEditados}
        onChange={handleChange}
        onSave={handleEditClient}

      />
    </div>
  )
}

export default GestionClientes;
