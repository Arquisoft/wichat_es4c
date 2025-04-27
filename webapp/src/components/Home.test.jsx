import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home'; // Asegúrate que la ruta sea correcta

// --- CONSTANTES DEL COMPONENTE (para usar en tests) ---
const ARC_INTERVAL_MS = 2000;
const MAX_ARCS = 5;
const ARC_STROKE = 0.5;

// --- MOCK MEJORADO DE react-globe.gl ---
// Guardaremos una referencia a las props pasadas al mock y al mock de controles
let capturedGlobeProps = {};
// En tu archivo de test, modifica el mockControls así:
const mockControls = {
  _enableZoom: false,
  get enableZoom() { return this._enableZoom; },
  set enableZoom(val) { this._enableZoom = val; },
  _enablePan: false,
  get enablePan() { return this._enablePan; },
  set enablePan(val) { this._enablePan = val; },
  _autoRotate: false,
  get autoRotate() { return this._autoRotate; },
  set autoRotate(val) { this._autoRotate = val; },
  _autoRotateSpeed: 0,
  get autoRotateSpeed() { return this._autoRotateSpeed; },
  set autoRotateSpeed(val) { this._autoRotateSpeed = val; },
  _minPolarAngle: 0,
  get minPolarAngle() { return this._minPolarAngle; },
  set minPolarAngle(val) { this._minPolarAngle = val; },
  _maxPolarAngle: Math.PI,
  get maxPolarAngle() { return this._maxPolarAngle; },
  set maxPolarAngle(val) { this._maxPolarAngle = val; },
};

// Limpiar mocks entre tests si es necesario (aunque Jest suele aislar)
beforeEach(() => {
    jest.clearAllMocks();
    // Resetear valores de propiedades simuladas si es necesario
    mockControls._autoRotate = false;
    mockControls._autoRotateSpeed = 0;
    mockControls._minPolarAngle = 0;
    mockControls._maxPolarAngle = Math.PI;
    capturedGlobeProps = {}; // Limpiar props capturadas
});

jest.mock('react-globe.gl', () => {
  const ActualReact = require('react');
  // --- FIN DEL CAMBIO ---

  // Usamos forwardRef porque el componente original usa useRef en el Globo
  // Ahora usamos la variable requerida: ActualReact
  const MockGlobe = ActualReact.forwardRef((props, ref) => {
    // Acceder a las variables definidas fuera (esto SÍ suele permitirlo Jest)
    capturedGlobeProps = props;

    // Simular la asignación de la ref si existe
    if (ref) {
      ref.current = {
        controls: () => mockControls, // Devolver nuestro mock de controles
      };
    }

    // Usar JSX requiere React en el ámbito, por eso lo requerimos antes
    return (
      <div
        data-testid="mock-globe"
        data-arcsdata-length={props.arcsData?.length || 0}
        data-width={props.width}
        data-height={props.height}
      >
        Mocked Globe Component
      </div>
    );
  });
  MockGlobe.displayName = 'MockGlobe';
  return MockGlobe;
});
// --- FIN DEL MOCK ---

describe('Home Component', () => {
  // Configurar fake timers antes de los tests que los necesiten
  beforeAll(() => {
    jest.useFakeTimers();
  });

  // Limpiar timers después de todos los tests
  afterAll(() => {
    jest.useRealTimers();
  });

  // --- TESTS EXISTENTES (con pequeñas mejoras si es necesario) ---
  test('renders the Home component with correct content', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /WICHAT/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Test your geography knowledge!/i, level: 6 })).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('register-button')).toBeInTheDocument();
    expect(screen.getByTestId('mock-globe')).toBeInTheDocument();
  });

  test('applies correct styles to the Home component', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const container = screen.getByTestId('home-container');
    expect(container).toHaveStyle('background: #000010'); // O rgb(0, 0, 16)
    const paperElement = screen.getByText(/WICHAT/i).closest('.MuiPaper-root');
    expect(paperElement).toHaveStyle('color: white');
  });

  // --- NUEVOS TESTS PARA COBERTURA ---

  test('generates arcs periodically using setInterval', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    let mockGlobe = screen.getByTestId('mock-globe');

    // Estado inicial: no hay arcos
    expect(mockGlobe.getAttribute('data-arcsdata-length')).toBe('0');
    expect(capturedGlobeProps.arcsData).toHaveLength(0); // Verificar props capturadas

    // Avanzar el tiempo justo para que se dispare el primer intervalo
    act(() => {
      jest.advanceTimersByTime(ARC_INTERVAL_MS);
    });

    // Re-seleccionar el mock para obtener los atributos actualizados
    mockGlobe = screen.getByTestId('mock-globe');
    // Debería haber 1 arco (cubre líneas 22-27 y 38-42 la primera vez)
    expect(mockGlobe.getAttribute('data-arcsdata-length')).toBe('1');
    expect(capturedGlobeProps.arcsData).toHaveLength(1);
    expect(capturedGlobeProps.arcsData[0]).toHaveProperty('startLat');
    expect(capturedGlobeProps.arcsData[0]).toHaveProperty('color');

    // Avanzar tiempo varias veces para verificar el límite MAX_ARCS
    act(() => {
      // Avanzamos suficiente tiempo para generar MAX_ARCS + 1 arcos adicionales
      jest.advanceTimersByTime(ARC_INTERVAL_MS * (MAX_ARCS));
    });

    mockGlobe = screen.getByTestId('mock-globe');
    // No debería haber más de MAX_ARCS arcos
    expect(mockGlobe.getAttribute('data-arcsdata-length')).toBe(String(MAX_ARCS));
     expect(capturedGlobeProps.arcsData).toHaveLength(MAX_ARCS);
  });

  test('clears the interval timer on unmount', () => {
    // Espiar la función global clearInterval
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

    const { unmount } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Asegurarse de que el intervalo se haya iniciado (avanzando un poco el tiempo)
    act(() => {
        jest.advanceTimersByTime(10); // Suficiente para que setInterval sea llamado
    });

    // Desmontar el componente
    unmount();

    // Verificar que clearInterval fue llamado (cubre líneas 55-56)
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    // Opcional: verificar que fue llamado con el ID correcto (más complejo)

    // Restaurar el spy
    clearIntervalSpy.mockRestore();
  });

  test('updates globe dimensions on window resize', () => {
    // Guardar dimensiones originales para restaurar (buena práctica)
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    let mockGlobe = screen.getByTestId('mock-globe');

    // Verificar dimensiones iniciales basadas en el window actual del test
    expect(mockGlobe.getAttribute('data-width')).toBe(String(originalInnerWidth));
    expect(mockGlobe.getAttribute('data-height')).toBe(String(originalInnerHeight));

    // Simular cambio de tamaño de la ventana
    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 400;
      // Disparar el evento 'resize'
      fireEvent(window, new Event('resize'));
    });

    // Re-seleccionar el mock
    mockGlobe = screen.getByTestId('mock-globe');
    // Verificar que las dimensiones se actualizaron (cubre líneas 65-66 dentro de handleResize)
    expect(mockGlobe.getAttribute('data-width')).toBe('500');
    expect(mockGlobe.getAttribute('data-height')).toBe('400');

    // Restaurar dimensiones originales
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
  });

   test('cleans up resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<MemoryRouter><Home /></MemoryRouter>);

      unmount();

      // Verificar que se llamó a removeEventListener para 'resize' (cubre línea 56)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
  });

  test('configures globe controls on mount and passes arcStroke prop', async () => {
    jest.useFakeTimers();
  
    await act(async () => {
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      );
      jest.runAllTimers();
    });
  
    // Verificar propiedades asignadas
    expect(mockControls.enableZoom).toBe(false);
    expect(mockControls.enablePan).toBe(false);
    expect(mockControls.autoRotate).toBe(true);
    expect(mockControls.autoRotateSpeed).toBe(2);
    expect(mockControls.minPolarAngle).toBe(Math.PI / 2);
    expect(mockControls.maxPolarAngle).toBe(Math.PI / 2);
  
    // Verificar prop arcStroke
    expect(typeof capturedGlobeProps.arcStroke).toBe('function');
    expect(capturedGlobeProps.arcStroke()).toBe(ARC_STROKE);
  
    jest.useRealTimers();
  });

});