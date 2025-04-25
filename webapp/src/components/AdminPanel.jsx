import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Button,
  Paper,
  Pagination
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import "../assets/css/StartMenu.css";

const AdminPanel = () => {
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${apiEndpoint}/adminPanel`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

const handleDeleteUser = async (username) => {
  const token = localStorage.getItem("token"); // Obtener el token almacenado

  try {
    const response = await fetch(`${apiEndpoint}/adminPanel/deleteUser/${username}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`, 
      },
    });

    if (response.ok) {
      setUsers((prev) => prev.filter((u) => u.username !== username));
    } else {
      console.error("Error deleting user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};


  useEffect(() => {
    fetchUsers();
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleGoBack = (e) => {
    navigate('/startmenu');
  };

  return (
    <Box className="start-menu-container" sx={{ p: 4 }}>
      <Paper elevation={5} sx={{
        p: 4,
        borderRadius: 4,
        backgroundColor: "#0C2D48",
        color: "#fff",
        boxShadow: 5
      }}>
        <Button
          variant="contained"
          onClick={handleGoBack}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            fontFamily: "Orbitron, sans-serif",
            backgroundColor:"#454c5a",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#3a404c",
            },
          }}
        >
          Volver atrás
        </Button>
        <Typography variant="h3" gutterBottom sx={{ color: "#FF6584", fontFamily: "Orbitron, sans-serif", fontWeight: "bold" }}>
          Panel de Administración
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ color: "#FED43F", fontFamily: "Orbitron, sans-serif" }}>
          Aquí puedes gestionar los usuarios y sus permisos.
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <>
            <Table sx={{ mt: 3 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#104E8B" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Usuario</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Rol</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentUsers.map((user) => (
                  <TableRow key={user._id || user.username}>
                    <TableCell sx={{ color: "#fff" }}>{user.username}</TableCell>
                    <TableCell sx={{ color: "#fff" }}>{user.role}</TableCell>
                    <TableCell>
                      {user.role !== 'admin' && (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteUser(user.username)}
                          sx={{
                            fontWeight: "bold",
                            fontFamily: "Orbitron, sans-serif",
                            backgroundColor: "#FF6584",
                            "&:hover": { backgroundColor: "#f50057" }
                          }}
                        >
                          Eliminar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, value) => setCurrentPage(value)}
                color="secondary"
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#fff",
                    fontFamily: "Orbitron, sans-serif",
                    "&.Mui-selected": {
                      backgroundColor: "#FF6584",
                    }
                  }
                }}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AdminPanel;
