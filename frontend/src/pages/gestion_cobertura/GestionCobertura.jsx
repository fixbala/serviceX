import React, { useState, useEffect } from 'react'; import './GestionCobertura.css';
import Lista from '../../components/Lista/Lista';
import Tabla from '../../components/Tabla/Tabla';
import Add from '../../components/Add/Add';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from 'axios';
import jwtDecode from 'jwt-decode';

 
const MySwal = withReactContent(Swal);

function GestionCobertura() {

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

  const [poligonos, setPoligonos] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [nombresPoligonos, setNombresPoligonos] = useState([]);

  const obtenerPoligonos = () => {
    axios.get('http://localhost:3000/api/poligonos', config)
      .then((response) => {
        const poligonosConId = response.data.map((poligono) => ({
          id: poligono.id_poligono,
          nombre_poligono: poligono.nombre_poligono,
          id_usuario: poligono.id_usuario,
        }));
        setPoligonos(poligonosConId);
        setFilasPoligono(poligonosConId);
      })
      .catch((error) => {
        console.error('Error al obtener poligonos:', error);
      });
  };

  const obtenerNombresPoligonos = () => {
    axios
      .get('http://localhost:3000/api/poligonos', config)
      .then((response) => {
        const nombresPoligonos = response.data.map((poligono) => poligono.nombre_poligono);
        setNombresPoligonos(nombresPoligonos);
      })
      .catch((error) => {
        console.error('Error al obtener nombres de poligonos:', error);
      });
  };

  useEffect(() => {
    obtenerPoligonos();
    obtenerNombresPoligonos();
  }, []);

  const crearPoligono = () => {
    if (poligono.trim() === '') {
      MySwal.fire({
        title: <strong>Error</strong>,
        html: <i>Por favor, ingrese un nombre para el poligono</i>,
        icon: 'error',
      });
      return;
    }

    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas crear el poligono?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {

        const nuevoPoligono = {
          nombre_poligono: poligono,
          id_usuario: idUsuario
        };

        axios.post('http://localhost:3000/api/poligonos', nuevoPoligono, config)
          .then((response) => {
            if (response.status === 200) {
              obtenerPoligonos();
              const poligonoCreado = response.data;
              const nuevoIdPoligono = poligonoCreado.id_poligono;
              setFilasPoligono([...filasPoligono, { id: nuevoIdPoligono, ...poligonoCreado }]);
              setPoligono('');
              MySwal.fire('Poligono creado', 'El poligono se ha creado correctamente', 'success');
            } else {
              Swal.fire('Error', 'No se pudo crear el poligono', 'error');
            }
          })
          .catch((error) => {
            Swal.fire('Error', 'Ocurrió un error al crear el poligono', error);
          });
      } else {
        response.dismiss === Swal.DismissReason.cancel
        window.location.reload();
      }
    })
  };

  const handleDeleteRow1 = (idPoligono) => {
    axios.delete(`http://localhost:3000/api/poligonos/${idPoligono}`, config)
      .then((response) => {
        if (response.status === 200) {
          console.log('Poligono eliminado correctamente');
        } else {
          console.error('No se pudo eliminar el poligono');
        }
      })
      .catch((error) => {
        console.error('Error al eliminar el poligono:', error);
      });
  };

  const handleEditPoligono = (editPoligono) => {
    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas editar el poligono?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {
        const idPoligonoAModificar = editPoligono.id;
        console.log('ID del poligono a modificar:', idPoligonoAModificar);
        const nuevoNombrePoligono = editPoligono.nombre_poligono;
        const modificacionesPoligono = {
          nombre_poligono: nuevoNombrePoligono,
          id_usuario: idUsuario

        };

        axios.put(`http://localhost:3000/api/poligonos/${idPoligonoAModificar}`, modificacionesPoligono, config)
          .then((response) => {
            if (response.status === 200) {
              obtenerPoligonos();
              setPoligono('');
              MySwal.fire('¡Exito!', 'El poligono se ha modificado correctamente', 'success');
            } else {
              MySwal.fire('Error', 'No se pudo modificar el poligono', 'error');
            }
          })
          .catch((error) => {
            MySwal.fire('Error', 'Ocurrió un error al modificar el poligono', error);
          });
      } else {
        response.dismiss === Swal.DismissReason.cancel
        window.location.reload();
      }
    })
  };


  const [poligono, setPoligono] = useState('');

  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger'
    },
    buttonsStyling: false
  })

  const obtenerPuntos = () => {
    axios.get('http://localhost:3000/api/puntos', config)
      .then((response) => {
        const puntos = response.data.map((punto) => ({
          id: punto.id_punto,
          punto: `${punto.latitud} - ${punto.longitud}`,
          poligono: punto.id_poligono,
        }));
        setFilasPunto(puntos);
      })
      .catch((error) => {
        console.error('Error al obtener puntos:', error);
      });
  };

  useEffect(() => {
    obtenerPuntos();
  }, []);

  const crearPunto = () => {
    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas crear el punto?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {

        const latitudNum = parseFloat(latitud);
        const longitudNum = parseFloat(longitud);

        if (isNaN(latitudNum) || isNaN(longitudNum)) {
          console.error('Latitud y longitud deben ser números válidos.');
          return;
        }

        const nombrePoligonoSeleccionado = poligonoSeleccionado;

        const idPoligonoSeleccionado = poligonos.find((poligono) => poligono.nombre_poligono === nombrePoligonoSeleccionado)?.id;

        if (idPoligonoSeleccionado) {
          const nuevoPunto = {
            latitud: latitudNum,
            longitud: longitudNum,
            id_poligono: idPoligonoSeleccionado,
          };

          axios.post('http://localhost:3000/api/puntos', nuevoPunto, config)
            .then((response) => {
              if (response.status === 200) {
                const puntoCreado = response.data;
                const nuevoIdPunto = puntoCreado.id_punto;

                const nuevaFilaPunto = {
                  id: nuevoIdPunto,
                  punto: `${latitud} - ${longitud}`,
                  poligono: poligonoSeleccionado,
                };
                setFilasPunto((prevFilas) => [...prevFilas, nuevaFilaPunto]);
                setLatitud('');
                setLongitud('');
                Swal.fire('Punto creado', 'El punto se ha creado correctamente', 'success');
                window.location.reload();
              } else {
                Swal.fire('Error', 'No se pudo crear el punto', 'error');
              }
            })
            .catch((error) => {
              Swal.fire('Error', 'Ocurrió un error al crear el punto', error);
            });
        }
      } else {
        response.dismiss === Swal.DismissReason.cancel
        window.location.reload();
      }
    })
  };


  const handleDeleteRow2 = (idPunto) => {
    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas eliminar el punto?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {
        axios.delete(`http://localhost:3000/api/puntos/${idPunto}`, config)
          .then((response) => {
            if (response.status === 200) {
              const nuevosPuntos = puntos.filter((punto) => punto.id !== idPunto);
              setPuntos(nuevosPuntos);
              MySwal.fire('Punto eliminado', 'El punto se ha eliminado correctamente', 'success');
              window.location.reload();
            } else {
              Swal.fire('Error', 'No se pudo eliminar el punto', 'error');
            }
          })
          .catch((error) => {
            Swal.fire('Error', 'Ocurrió un error al eliminar el punto', error);
          });
      } else {
        response.dismiss === Swal.DismissReason.cancel
        window.location.reload(); s
      }
    })
  };


  const handleEditPunto = (editedPunto) => {
    swalWithBootstrapButtons.fire({
      text: "¿Estas seguro de que deseas editar el plan?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
    }).then(response => {
      if (response.isConfirmed) {
        const [latitudStr, longitudStr] = editedPunto.punto.split(' - ');
        const latitud = parseFloat(latitudStr);
        const longitud = parseFloat(longitudStr);
        if (!isNaN(latitud) && !isNaN(longitud)) {

          axios
            .put(`http://localhost:3000/api/puntos/${editedPunto.id}`, {
              latitud: latitud,
              longitud: longitud,
              id_poligono: editedPunto.poligono,
            }, config)
            .then((response) => {
              if (response.status === 200) {
                obtenerPuntos();
                setLatitud('');
                setLongitud('');
                MySwal.fire('¡Exito!', 'El punto se ha editado correctamente', 'success');
                window.location.reload();
              } else {
                Swal.fire('Error', 'No se pudo editar el punto', 'error');
              }
            })
            .catch((error) => {
              Swal.fire('Error', 'Ocurrió un error al editar el punto', error);
            });
        } else {
          MySwal.fire({
            title: <strong>Error</strong>,
            html: <i>Por favor, complete todos los campos</i>,
            icon: 'error'
          });
        }
      } else {
        response.dismiss === Swal.DismissReason.cancel
        window.location.reload();
      }
    })
  };

  const [camposEditados, setCamposEditados] = useState({});

  const handleChange = (event) => {
    const { id, value } = event.target;
    setCamposEditados({ ...camposEditados, [id]: value })
  }

  const columnasPoligono = [
    {
      field: 'id',
      headerName: 'ID',
      width: 50,
    },

    {
      field: 'nombre_poligono',
      headerName: 'Poligono',
      width: 150,
      editable: true
    }
  ]

  const columnasPunto = [
    {
      field: 'punto',
      headerName: 'Punto',
      width: 100,
      editable: true
    },

    {
      field: 'poligono',
      headerName: 'Poligono',
      width: 150,
      editable: true
    }

  ]

  const [filasPoligono, setFilasPoligono] = useState([]);
  const [filasPunto, setFilasPunto] = useState([]);

  const items = nombresPoligonos.map((nombre) => ({
    id: nombre,
    name: nombre,
  }));

  ///////////Modales del modulo se definen las props/////////////////
  //modal 1: Editar poligono
  const modalPoligono = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
      editable: true,
    },

    {
      field: 'poligono',
      headerName: 'Poligono',
      width: 100,
      editable: true,
    }

  ]

  //modal 2:  Editar Puntos - Poligono
  const modalPunto = [
    {
      field: 'latitud',
      headerName: 'Latitud',
      width: 100,
      editable: true,
    },

    {
      field: 'longitud',
      headerName: 'Longitud',
      width: 100,
      editable: true,
    },

    {
      field: 'poligono',
      headerName: 'Poligono',
      width: 100,
      type: 'select',
      options: ['Poligono 1', 'Poligono 2', ' Poligono 3'],
      editable: true,
    }

  ]
  const [poligonoSeleccionado, setPoligonoSeleccionado] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);

  const handleEditRow = (id) => {
    console.log("selecciono la fila con" + id + "en gestion de usuarios");
    setShowModal(true);
  };
  const handleEditRow2 = (id) => {
    console.log("selecciono la fila con" + id + "en gestion de usuarios");
    setShowModal2(true);
  };

  // Contenido del modulo
  return (

    <div className='contenedor-principal-cob'>
      <div className='titulo-cobertura'>
        <h1>Gestion de cobertura</h1>
        <hr className='linea-cobertura' />
      </div>

      <div className='contenedor-izquierdo-cob'>
        <div className='flex-cobertura'>
          <input className='input-cobertura' type='text' name='poligono' id='poligono' onChange={(e) => setPoligono(e.target.value)} />
          <button className='boton-cobertura' onClick={crearPoligono}>Crear poligono</button>
        </div>

        <div className='tabla-poligonos'>
          <Tabla columns={columnasPoligono} rows={filasPoligono} actions handleEditRow={handleEditRow} handleEditPoligono={handleEditPoligono} handleDeleteRow={handleDeleteRow1} />
        </div>


      </div>


      <div className='contenedor-derecho-cob'>
        <h3>Ingresar la latitud</h3>
        <div className='flex-cobertura'>
          <input className='input-cobertura' type='text' name='latitud' id='latitud' onChange={(e) => setLatitud(e.target.value)} />

        </div>

        <h3>Ingresar la longitud</h3>
        <div className='flex-cobertura'>
          <input className='input-cobertura' type='text' name='longitud' id='longitud' onChange={(e) => setLongitud(e.target.value)} />

        </div>

        <div className='lista-btn'>
          <Lista items={items} label='Seleccionar poligono' value={poligonoSeleccionado} setValue={setPoligonoSeleccionado} />
          <button className='boton-cobertura2' onClick={crearPunto}>Crear punto</button>
        </div>

        <div className='tabla-puntos'>
          <Tabla columns={columnasPunto} rows={filasPunto} actions handleEditRow={handleEditRow2} handleEditPunto={handleEditPunto} handleDeleteRow={handleDeleteRow2} />
        </div>


      </div>
      <Add
        estado={showModal}
        cambiarEstado={setShowModal}
        titulo="Editar Poligono"
        campos={modalPoligono.map(({ defaultValue: campo, field: idCampo, type, options }) => {
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
      />

      <Add
        estado={showModal2}
        cambiarEstado={setShowModal2}
        titulo="Editar Puntos y Poligono"
        campos={modalPunto.map(({ headerName: campo, field: idCampo, typeCampo }) => {
          return { campo, idCampo, typeCampo };
        })}
        camposEditados={camposEditados}
        onChange={handleChange}
        onSave={handleEditPunto}
      />
    </div>
  )
}


export default GestionCobertura;
