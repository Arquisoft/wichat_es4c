import { useState, useEffect } from "react";
 import { useNavigate, useParams } from 'react-router-dom';
 import { Card, CardContent, CardActions, Button, TextField, Typography, Box, FormControlLabel, Checkbox, Snackbar, Alert, FormGroup } from "@mui/material";
 import SettingsIcon from '@mui/icons-material/Settings';
 import SaveIcon from '@mui/icons-material/Save';
 import ArrowBackIcon from '@mui/icons-material/ArrowBack';
 import "../assets/css/AnimatedBackground.css";

 export default function SettingsCard() {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [warningSnackbar, setWarningSnackbar] = useState(false);
  const [errorSnackbar, setErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [allCategoriesDisabledSnackbar, setAllCategoriesDisabledSnackbar] = useState(false);
  const [settings, setSettings] = useState({
    answerTime: 60,
    questionAmount: 10,
    capitalQuestions: true,
    flagQuestions: true,
    monumentQuestions: true,
    foodQuestions: true
  });
  const [loading, setLoading] = useState(true);
  const [timeWarningSnackbar, setTimeWarningSnackbar] = useState(false);

  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

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
        const response = await fetch(`${apiEndpoint}/getSettings/${username}`);

        if (!response.ok) {
          const errorData = await response.text();
          console.error("API Error:", errorData);
          throw new Error(`Error ${response.status}: No se pudo obtener la información del perfil`);
        }

        const data = await response.json();
        console.log("Settings data received:", data);

        // Initialize settings with received data or defaults
        setSettings({
          answerTime: data.answerTime || 60,
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
  }, [username, navigate, apiEndpoint]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if ((name === "answerTime" || name === "questionAmount") && parseInt(value) < 0) {
      return;
    }
  
    if (name === "questionAmount" && parseInt(value) > 30) {
      setWarningSnackbar(true);
      return;
    }
  
    if (name === "answerTime" && parseInt(value) > 60) {
      setTimeWarningSnackbar(true);
      return;
    }
  
    setSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (
        name === "answerTime" || name === "questionAmount" ? parseInt(value) || 0 : value
      )
    }));
  };
  

  const handleSave = async () => {
    console.log("Guardando ajustes:", settings);

    if (
      !settings.capitalQuestions &&
      !settings.flagQuestions &&
      !settings.monumentQuestions &&
      !settings.foodQuestions
    ) {
      setAllCategoriesDisabledSnackbar(true);
      return;
    }


    try {
      const response = await fetch(`${apiEndpoint}/saveSettings/${username}`, {
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
      setTimeout(() => {
        handleBack();
      }, 1000);
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
          background: 'radial-gradient(circle, #3f51b5 0%, #1a237e 100%)',
        }}>
        <Typography variant="h5" color="white">Cargando ajustes...</Typography>
      </Box>
    );
  }

  return (
    <Box className="start-menu-container" display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{
        padding: 4,
        backgroundSize: "200% 200%",
        animation: "floatBg 40s ease-in-out infinite",
        '@keyframes floatBg': {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' }
        },
        p: 2,
        fontFamily: 'Orbitron, sans-serif',
        overflow: "hidden"
      }}>
      <Card sx={{
        maxWidth: 600,
        p: 3,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
        borderRadius: 4,
        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(50, 50, 50, 0.7))",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        color: "#ffffff",
        width: "100%",
      }}>

        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <SettingsIcon sx={{ color: "#64b5f6", mr: 1, fontSize: "2rem" }} />
            <Typography variant="h5" gutterBottom fontWeight="bold" fontFamily="Roboto, sans-serif">
              Ajustes del Juego
            </Typography>
          </Box>
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
              InputLabelProps={{ style: { color: "#f5f5f5" } }}
              InputProps={{
                style: { color: "#f5f5f5" },
                inputProps: { min: 0 }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#f5f5f5" },
                  "&:hover fieldset": { borderColor: "#bbdefb" },
                  "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                },
              }}
            />
          ))}
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={!!settings.capitalQuestions} onChange={handleChange} name="capitalQuestions" sx={{ color: "#bbdefb", "&.Mui-checked": { color: "#64b5f6" } }} />}
              label={<Typography color="#f5f5f5" fontFamily="Roboto, sans-serif">Mostrar preguntas sobre capitales</Typography>}
            />
            <FormControlLabel
              control={<Checkbox checked={!!settings.flagQuestions} onChange={handleChange} name="flagQuestions" sx={{ color: "#bbdefb", "&.Mui-checked": { color: "#64b5f6" } }} />}
              label={<Typography color="#f5f5f5" fontFamily="Roboto, sans-serif">Mostrar preguntas sobre banderas</Typography>}
            />
            <FormControlLabel
              control={<Checkbox checked={!!settings.monumentQuestions} onChange={handleChange} name="monumentQuestions" sx={{ color: "#bbdefb", "&.Mui-checked": { color: "#64b5f6" } }} />}
              label={<Typography color="#f5f5f5" fontFamily="Roboto, sans-serif">Mostrar preguntas sobre monumentos</Typography>}
            />
            <FormControlLabel
              control={<Checkbox checked={!!settings.foodQuestions} onChange={handleChange} name="foodQuestions" sx={{ color: "#bbdefb", "&.Mui-checked": { color: "#64b5f6" } }} />}
              label={<Typography color="#f5f5f5" fontFamily="Roboto, sans-serif">Mostrar preguntas sobre comida</Typography>}
            />
          </FormGroup>
        </CardContent>
        <CardActions sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button
            onClick={handleBack}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: "#bbdefb",
              borderColor: "#bbdefb",
              fontWeight: "bold",
              "&:hover": { borderColor: "#fff", color: "#fff" },
              fontFamily: "Roboto, sans-serif",
            }}
          >
            Volver
          </Button>
          <Button
            data-testid="save-settings-button"
            onClick={handleSave}
            variant="contained"
            endIcon={<SaveIcon />}
            sx={{
              backgroundColor: "#64b5f6",
              color: "#fff",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#42a5f5" },
              fontFamily: "Roboto, sans-serif",
            }}
          >
            Guardar
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
          ¡Ajustes guardados con éxito!
        </Alert>
      </Snackbar>

      {/* Warning notification for question amount */}
      <Snackbar
        open={warningSnackbar}
        autoHideDuration={3000}
        onClose={() => setWarningSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setWarningSnackbar(false)}>
          El número máximo de preguntas es 30.
        </Alert>
      </Snackbar>

      {/* Warning notification for answer time */}
      <Snackbar
        open={timeWarningSnackbar}
        autoHideDuration={3000}
        onClose={() => setTimeWarningSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setTimeWarningSnackbar(false)}>
          El tiempo máximo de respuesta es 60 segundos.
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

            {/* Error notification if all categories are disabled */}
      <Snackbar
        open={allCategoriesDisabledSnackbar}
        autoHideDuration={4000}
        onClose={() => setAllCategoriesDisabledSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setAllCategoriesDisabledSnackbar(false)}>
          ¡Debes activar al menos una categoría de preguntas!
        </Alert>
      </Snackbar>


    </Box>
  );
 }