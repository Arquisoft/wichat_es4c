import { useState, useEffect } from "react";
import { useNavigate, useParams} from 'react-router-dom';
import { Card, CardContent, CardActions, Button, TextField, Typography, Box, FormControlLabel, Checkbox, Snackbar, Alert } from "@mui/material";
import axios from 'axios';
import { act } from 'react-dom/test-utils'; // Import act for testing

export default function SettingsCard() {

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [warningSnackbar, setWarningSnackbar] = useState(false); // Nuevo estado para el Snackbar de advertencia
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paramAliases = {
    answerTime: "Tiempo de respuesta (s)",
    questionAmount: "Cantidad de preguntas",
  };

  const username  = useParams();

  useEffect(() => {
      if (!username) {
        navigate("/startmenu");
        return;
      }
  
      const fetchUserSettings = async () => {
        try {
          const response = await fetch(`http://localhost:8001/getSettings/${username}`);
          if (!response.ok) {
            throw new Error("No se pudo obtener la información del perfil");
          }
          const data = await response.json();
          act(() => { // Wrap state updates in act
            setUser(data);
          });
        } catch (error) {
          act(() => { // Wrap state updates in act
            setError(error.message);
          });
        } finally {
          act(() => { // Wrap state updates in act
            setLoading(false);
          });
        }
      };
  
      fetchUserSettings();
  }, [username, navigate]);

  useEffect(() => {
    if (user) {
      setSettings({
        answerTime: user.answerTime || 10, // Valores por defecto en caso de undefined
        questionAmount: user.questionAmount || 10,
        capitalQuestions: user.capitalQuestions ?? true,
        flagQuestions: user.flagQuestions ?? true,
        monumentQuestions: user.monumentQuestions ?? true,
        foodQuestions: user.foodQuestions ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "questionAmount" && value > 40) {
      setWarningSnackbar(true); // Mostrar advertencia si excede el límite
      return;
    }

    setSettings({ ...settings, [name]: type === "checkbox" ? checked : value });
  };

  const handleSave = async () => {
    console.log("Botón Guardar presionado"); 
    try {
      const response = await fetch(`http://localhost:8001/saveSettings/${username}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings), // Fix: Send settings directly
      });
      if (response.ok) { // Fix: Check response.ok instead of status
        setOpenSnackbar(true);
      } else {
        console.error("Error al guardar los ajustes:", await response.json());
      }
    } catch (error) {
      console.error("Error al guardar los ajustes:", error);
    }
  };

  const handleBack = () => {
    navigate("/startmenu");
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" 
      sx={{ 
        background: 'linear-gradient(90deg,rgb(73, 17, 203),rgb(113, 29, 182),rgb(38, 35, 223), #66ccff, #4e69c2)', 
        backgroundSize: '400% 400%', 
        animation: 'gradientWave 10s infinite normal forwards',
        '@keyframes gradientWave': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          }
        }
      }}>
      <Card sx={{ maxWidth: 600, p: 3, boxShadow: 3, borderRadius: 2, backgroundColor: " #ff4081", backdropFilter: "blur(10px)" }}>
        <CardContent>
          <Typography variant="h4" gutterBottom color={"#fff"}>
            Ajustes
          </Typography>
          {Object.keys(paramAliases).map((key) => (
            <TextField
              key={key}
              label={paramAliases[key]}
              name={key}
              value={settings[key] ??""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              InputLabelProps={{ style: { color: "white" } }}
              InputProps={{ style: { color: "white", borderColor: "white" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "white" },
                  "&:hover fieldset": { borderColor: "white" },
                  "&.Mui-focused fieldset": { borderColor: "white" },
                }
              }}
            />
          ))}
          <FormControlLabel
            control={<Checkbox checked={settings.capitalQuestions?? true} onChange={handleChange} name="capitalQuestions"sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre capitales"
            sx={{color:"#fff", "&.mui-checked": {color: " #fff"}}}
          />
          <FormControlLabel
            control={<Checkbox checked={settings.flagQuestions??true} onChange={handleChange} name="flagQuestions" sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre banderas"
            sx={{color:"#fff", "&.mui-checked": {color: " #fff"}}}
          />
          <FormControlLabel
            control={<Checkbox checked={settings.monumentQuestions??true} onChange={handleChange} name="monumentQuestions" sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre monumentos"
            sx={{color:"#fff", "&.Mui-checked": {background: " #fff"}}}
          />
          <FormControlLabel
            control={<Checkbox checked={settings.foodQuestions??true} onChange={handleChange} name="foodQuestions" sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre comida"
            sx={{color:"#fff", "&.Mui-checked": {color: " #fff"}}}
          />
        </CardContent>
        <CardActions>
          <Button onClick={handleSave} variant="contained"  fullWidth
          sx={{ backgroundColor: "#fff", color: " #f50057", fontWeight: "bold", 
            '&:hover': { bgcolor: '# ff4081', color: "#fff"} 
          }}>
            Guardar
          </Button>
          <Button onClick={handleBack} variant="contained" fullWidth 
            sx={{ backgroundColor: "#fff", color: " #f50057", fontWeight: "bold", 
              '&:hover': { bgcolor: '# ff4081', color: "#fff"} 
            }}>
            Volver
          </Button>
        </CardActions>
      </Card>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000} // Se oculta después de 5 segundos
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setOpenSnackbar(false)}>
          ¡Guardado con éxito!
        </Alert>
      </Snackbar>
      <Snackbar
        open={warningSnackbar}
        autoHideDuration={5000} // Se oculta después de 5 segundos
        onClose={() => setWarningSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setWarningSnackbar(false)}>
          El número máximo de preguntas es 40.
        </Alert>
      </Snackbar>
    </Box>
  );
}

