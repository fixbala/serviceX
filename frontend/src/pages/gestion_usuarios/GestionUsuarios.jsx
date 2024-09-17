import React from 'react';
import "./GestionUsuarios.css";
import Tabla from '../../components/Tabla/Tabla';
import Add from '../../components/Add/Add';
import Swal from "sweetalert2";
import { useState, useEffect } from 'react';
import withReactContent from "sweetalert2-react-content";
import axios from 'axios';
import jwtDecode from 'jwt-decode';


const MySwal = withReactContent(Swal);


function GestionUsuarios() {

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

  const [sedeDepartamentoOptions, setSedeDepartamentoOptions] = useState([]);

  const [usuarios, setUsuarios] = useState([]);

  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
  })

  const obtenerSedepartamentoOptions = () => {
    axios.get('http://localhost:3000/api/sedesdepartamentos',config)
      .then(response => {
        if (response.status === 200) {
          const opciones = response.data.map(opcion => ({
            value: opcion.id_sede_departamento,
            label: opcion.sede_departamento,
          }));
          setSedeDepartamentoOptions(opciones);
        } else {
          console.error('Error al obtener las opciones de sedepartamento:', response);
        }
      })  
      .catch(error => {
        console.error('Error al obtener las opciones de sedepartamento:', error);
        });
      };
  
  
  useEffect(() => {
    obtenerSedepartamentoOptions();
  }, []);
 
  const columnas = [
    { field: "id", headerName: "ID", width: 40, editable: false },

    {
      field: "usuario",
      headerName: "Usuario",
      width: 100,
      editable: true,
    },
    {
      field: "nombre",
      headerName: "Nombre",
      width: 130,
      editable: true,
    },
    {
      field: "apellido",
      headerName: "Apellido",
      width: 130,
      editable: true,
    },
    {
      field: "sedepartamento",
      headerName: "Sede - Departamento",
      description: "Esta es la pregunta de seguridad",
      width: 200,
      type: "select",
      options: sedeDepartamentoOptions,
      editable: true,
    },
    {
      field: "extensiontelefonica",
      headerName: "Extension telefonica",
      width: 180,
      editable: true,
    },
    {
      field: "telefono",
      headerName: "Telefono",
      width: 120,
      type: "number",
      editable: true,
    },
    {
      field: "cedula",
      headerName: "Cedula",
      width: 120,
      type: "number",
      editable: true,
    },
    {
      field: "correo",
      headerName: "Correo",
      width: 180,
      editable: true,
    },

    {
      field: "pregunta",
      headerName: "Pregunta",
      width: 130,
      editable: true,
    },
    {
      field: "tipousuario",
      headerName: "Tipo de usuario",
      description: "Esta es el tipo de usuario",
      width: 160,
      type: "select",
      editable: true,
      options: [
        {
          value: 1,
          label: "Administrador",
        },
        {
          value: 2,
          label: "Jefes de Sedes",
        },
        {
          value: 3,
          label: "Usuarios Creación de Archivos",
        },
        {
          value: 4,
          label: "Usuarios solo lectura",
        },
      ],
    },
  ];

  const seguridad = [
    {
      field: "clave",
      headerName: "Clave",
      width: 140,
      editable: true,
    },
    {
      field: "respuesta",
      headerName: "Respuesta",
      width: 160,
      editable: true,
    },
  ]; 

  const todasLasColumnas = [...columnas, ...seguridad];

  const [filas, setFilas] = useState([]) //esto es del modal agregar
  const [estadoModal1, cambiarEstadoModal1] = useState(false); //esto es del modal de agregar
  const [showModal, setShowModal] = useState(false);  //Aca manejamos los estados del modal editar

  // Función para obtener los usuarios desde la API
 const obtenerUsuarios = () => {
  axios.get('http://localhost:3000/api/usuarios',config)
    .then(response => {
      const usuariosConId = response.data.map(usuario => ({
        id: usuario.id_usuario,
        usuario: usuario.nombre_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        pregunta: usuario.pregunta,
        extensiontelefonica: usuario.extension_telefonica,
        telefono: usuario.telefono,
        cedula: usuario.cedula,
        correo: usuario.correo,
        sedepartamento: usuario.id_sededepar,
        tipousuario: usuario.id_tipousuario
      }));
      setUsuarios(usuariosConId);
      setFilas(usuariosConId);
    })
    .catch(error => {
      console.error('Error al obtener usuarios:', error);
    });

};

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const handleEditUser = (editedUser) => {

    swalWithBootstrapButtons.fire({
      text: "Estas seguro de que deseas editar el usuario?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
      }).then (response =>{
    if (response.isConfirmed){
    const propertyMap = {
      id: 'id_usuario',
      usuario: 'nombre_usuario',
      nombre: 'nombre',
      apellido: 'apellido',
      pregunta: 'pregunta',
      extensiontelefonica: 'extension_telefonica',
      telefono: 'telefono',
      cedula: 'cedula',
      correo: 'correo',
      sedepartamento: 'id_sededepar',
      tipousuario: 'id_tipousuario',
    };
    
    const requestBody = {};

    for (const key in editedUser) {
      if (key in propertyMap) {
        requestBody[propertyMap[key]] = editedUser[key];
      } else {
        requestBody[key] = editedUser[key];
      }
    }
    axios
      .patch(`http://localhost:3000/api/usuarios/edit/${editedUser.id}`, requestBody,config)
      .then((response) => {
        if (response.status === 200) {
          obtenerUsuarios();
          setShowModal(false);
          Swal.fire('¡Exito!', 'Usuario editado correctamente', 'success')
        } else {
          Swal.fire('Error', 'Error al editar el usuario', 'error')
        }
      })
      .catch((error) => {
        Swal.fire('Error', 'Error al editar el usuario', error)
      });
      } else {
        response.dismiss === Swal.DismissReason.cancel;
        window.location.reload();
      }
    })
  };

  const handleEditClick = (row) => {
    props.handleEditUser(row);
    handleEditUser(row);
  };
  useEffect(() => {
    obtenerUsuarios();
  }, []);


  const handleEditRow = (id) => {
    console.log("selecciono la fila con" + id + "en gestion de usuarios");
    setCamposEditados(filas.id);
    setShowModal(true);
  };

  const handleDeleteClick = (idUsuario) => {
    // Realiza la solicitud PATCH para eliminar el usuario
    axios.patch(`http://localhost:3000/api/usuarios/${idUsuario}`,config)
      .then(response => {
        if (response.status === 200) {
          obtenerUsuarios();
        } else {
          Swal.fire('Error','Error al eliminar el usuario','error');
        }
      })
      .catch(error => {
        console.error('Error al eliminar el usuario: a', error);
      });
  };
  

  const handleDeleteRow = (id) => {
     swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas eliminar el usuario?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
      }).then(response => {
        if (response.isConfirmed){
        console.log("borrando fila" + id + "en gestion de usuarios");
        const nuevasFilas = filas.filter((fila) => fila.id !== id);
        setFilas(nuevasFilas);
        handleDeleteClick(id);
        MySwal.fire('Success', 'Usuario eliminado correctamente', 'success')
        window.location.reload();
        }else {
        response.dismiss === Swal.DismissReason.cancel
        setFilas(filas);
        }
      })
  }


const [camposEditados, setCamposEditados] = useState({});  // aca estaba definiendo para la actualizacion de la fila de la tabla 
 
  const handleChange = (event) => {
    const {id, value} = event.target;
    setCamposEditados({...camposEditados, [id]: value})
  }

  const agregarUsuario = (nuevoUsuario) => {

  swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas crear el usuario?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
  }).then(response => {

    if (response.isConfirmed){
    const formData = new FormData();
    const nuevaImagen = new File([], 'user.png', { type: 'image/png' }); 
  
      formData.append('nombre_usuario', nuevoUsuario.usuario);
      formData.append('nombre', nuevoUsuario.nombre);
      formData.append('apellido', nuevoUsuario.apellido);
      formData.append('pregunta', nuevoUsuario.pregunta);
      formData.append('extension_telefonica', nuevoUsuario.extensiontelefonica);
      formData.append('telefono', nuevoUsuario.telefono);
      formData.append('cedula', nuevoUsuario.cedula);
      formData.append('correo', nuevoUsuario.correo);
      formData.append('id_sededepar', nuevoUsuario.sedepartamento);
      formData.append('clave', nuevoUsuario.clave);
      formData.append('respuesta', nuevoUsuario.respuesta);
      formData.append('id_tipousuario', nuevoUsuario.tipousuario);
      formData.append('fileUsuario', nuevaImagen);
    
    axios.post('http://localhost:3000/api/usuarios', formData,config)
    .then(response => {
      console.log('Respuesta de la solicitud:', response);
      if (response.status === 200) {
        cambiarEstadoModal1(false); 
        MySwal.fire('Exito','Has creado el usuario','success')
      } else {
        MySwal.fire('Error','Error al crear el usuario', 'error');
      }
    })
    .catch(error => {
      MySwal.fire('Error','Error al crear el usuario', 'error');
      if (error.response) {
      console.log('Respuesta de error:', error.response.data);
      }
    });
    } else {
      response.dimiss== Swal.DismissReason.cancel;
      window.location.reload();
    }
  })
};

  
  return (

    <div>

      <div className='contenedor-gestion'>
        <div className='titulo-usuarios'>
          <h1>Gestion de usuarios</h1>
          <hr />
        </div>
        <div className='contenedor-busqueda'> 
          <button className='boton-usuarios' onClick={() => cambiarEstadoModal1(!estadoModal1)}>Agregar</button>

          
        </div>
        <Add
            estado={showModal}
            cambiarEstado={setShowModal}
            titulo="Editar Usuario" //este es el modelo del  componente modal para el editado difiere en algunos detalles con el
            campos={columnas.map(({ headerName: campo, field: idCampo, typeCampo }) => { //El problema esta aqui 
            return { campo, idCampo, typeCampo};
              })}
            camposEditados = {camposEditados}
            onChange={handleChange}
            onSave={handleEditUser}
          />
        
        
 
       
        <Add
          estado={estadoModal1}
          cambiarEstado={cambiarEstadoModal1}
          titulo="Agregar Usuario"
          campos={todasLasColumnas.map(({ headerName: campo, field: idCampo, type, options }) => {
            if (type === 'select' ) {
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
          onGuardar={(nuevoUsuario) => {
          agregarUsuario(nuevoUsuario); // Llama a la función para agregar el usuario
          }}
          
        />
        <div className='contenedor-tabla'>
        <Tabla
            columns={columnas}
            rows={filas}
            actions
            handleEditClick={handleEditRow}
            handleDeleteRow={handleDeleteRow}
            handleEditUser={handleEditUser}
          />
        </div>
      </div>

    </div>

  );

}

export default GestionUsuarios;