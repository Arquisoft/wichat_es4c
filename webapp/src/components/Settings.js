import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardActions, Button, TextField, Typography, Box, FormControlLabel, Checkbox, Snackbar, Alert } from "@mui/material";

export default function SettingsCard() {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [warningSnackbar, setWarningSnackbar] = useState(false);
  const [errorSnackbar, setErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    answerTime: 10,
    questionAmount: 10,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });
  const [loading, setLoading] = useState(true);

  const paramAliases = {
    answerTime: "Tiempo de respuesta (s)",
    questionAmount: "Cantidad de preguntas",
  };

  const { username } = useParams();

  useEffect(() => {
    if (!username) {
      navigate("/startmenu");
      return;
    }

    const fetchUserSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8001/getSettings/${username}`);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("API Error:", errorData);
          throw new Error(`Error ${response.status}: No se pudo obtener la información del perfil`);
        }
        
        const data = await response.json();
        console.log("Settings data received:", data);
        setUser(data);
        
        // Initialize settings with received data or defaults
        setSettings({
          answerTime: data.answerTime || 10,
          questionAmount: data.questionAmount || 10,
          capitalQuestions: data.capitalQuestions ?? true,
          flagQuestions: data.flagQuestions ?? true,
          monumentQuestions: data.monumentQuestions ?? true,
          foodQuestions: data.foodQuestions ?? true,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        setErrorMessage(error.message || "Error al cargar los ajustes");
        setErrorSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [username, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "questionAmount" && parseInt(value) > 40) {
      setWarningSnackbar(true);
      return;
    }

    setSettings(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : (
        // Convert string values to numbers for numeric fields
        name === "answerTime" || name === "questionAmount" ? parseInt(value) || 0 : value
      )
    }));
  };

  const handleSave = async () => {
    console.log("Guardando ajustes:", settings);
    try {
      const response = await fetch(`http://localhost:8001/saveSettings/${username}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error(`Error ${response.status}: No se pudieron guardar los ajustes`);
      }
      
      const data = await response.json();
      console.log("Save response:", data);
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage(error.message || "Error al guardar los ajustes");
      setErrorSnackbar(true);
    }
  };

  const handleBack = () => {
    navigate("/startmenu");
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" 
        sx={{ 
          background: 'linear-gradient(90deg,rgb(73, 17, 203),rgb(113, 29, 182),rgb(38, 35, 223), #66ccff, #4e69c2)', 
          backgroundSize: '400% 400%', 
          animation: 'gradientWave 10s infinite normal forwards',
          '@keyframes gradientWave': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          }
        }}>
        <Typography variant="h5" color="white">Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" 
      sx={{ 
        background: 'linear-gradient(90deg,rgb(73, 17, 203),rgb(113, 29, 182),rgb(38, 35, 223), #66ccff, #4e69c2)', 
        backgroundSize: '400% 400%', 
        animation: 'gradientWave 10s infinite normal forwards',
        '@keyframes gradientWave': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      }}>
      <Card sx={{ maxWidth: 600, p: 3, boxShadow: 3, borderRadius: 2, backgroundColor: "#ff4081", backdropFilter: "blur(10px)" }}>
        <CardContent>
          <Typography variant="h4" gutterBottom color={"#fff"}>
            Ajustes
          </Typography>
          {Object.keys(paramAliases).map((key) => (
            <TextField
              key={key}
              label={paramAliases[key]}
              name={key}
              type="number"
              value={settings[key] ?? ""}
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
            control={<Checkbox checked={!!settings.capitalQuestions} onChange={handleChange} name="capitalQuestions" sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre capitales"
            sx={{color:"#fff"}}
          />
          <FormControlLabel
            control={<Checkbox checked={!!settings.flagQuestions} onChange={handleChange} name="flagQuestions" sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre banderas"
            sx={{color:"#fff"}}
          />
          <FormControlLabel
            control={<Checkbox checked={!!settings.monumentQuestions} onChange={handleChange} name="monumentQuestions" sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre monumentos"
            sx={{color:"#fff"}}
          />
          <FormControlLabel
            control={<Checkbox checked={!!settings.foodQuestions} onChange={handleChange} name="foodQuestions" sx={{
              color: "white",
              "&.Mui-checked": { color: "white" }
            }}/>}
            label="Mostrar preguntas sobre comida"
            sx={{color:"#fff"}}
          />
        </CardContent>
        <CardActions>
          <Button onClick={handleSave} variant="contained" fullWidth
            sx={{ backgroundColor: "#fff", color: "#f50057", fontWeight: "bold", 
              '&:hover': { bgcolor: '#ff4081', color: "#fff"} 
            }}>
            Guardar
          </Button>
          <Button onClick={handleBack} variant="contained" fullWidth 
            sx={{ backgroundColor: "#fff", color: "#f50057", fontWeight: "bold", 
              '&:hover': { bgcolor: '#ff4081', color: "#fff"} 
            }}>
            Volver
          </Button>
        </CardActions>
      </Card>
      
      {/* Success notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setOpenSnackbar(false)}>
          ¡Guardado con éxito!
        </Alert>
      </Snackbar>
      
      {/* Warning notification */}
      <Snackbar
        open={warningSnackbar}
        autoHideDuration={3000}
        onClose={() => setWarningSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setWarningSnackbar(false)}>
          El número máximo de preguntas es 40.
        </Alert>
      </Snackbar>
      
      {/* Error notification */}
      <Snackbar
        open={errorSnackbar}
        autoHideDuration={5000}
        onClose={() => setErrorSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorSnackbar(false)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}