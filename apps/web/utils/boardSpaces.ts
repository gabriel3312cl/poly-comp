export const BOARD_SPACES = [
    { index: 0, name: "Salida", type: "corner", price: null, color: null },
    { index: 1, name: "Avenida Mediterráneo", type: "property", price: 60, color: "#8B4513" }, // Brown
    { index: 2, name: "Arca Comunal", type: "chest", price: null, color: null },
    { index: 3, name: "Avenida Báltica", type: "property", price: 60, color: "#8B4513" },
    { index: 4, name: "Impuesto sobre Ingresos", type: "tax", price: 200, color: null },
    { index: 5, name: "Ferrocarril Reading", type: "transport", price: 200, color: "#000000" },
    { index: 6, name: "Avenida Oriental", type: "property", price: 100, color: "#87CEEB" }, // Light Blue
    { index: 7, name: "Fortuna", type: "chance", price: null, color: null },
    { index: 8, name: "Avenida Vermont", type: "property", price: 100, color: "#87CEEB" },
    { index: 9, name: "Avenida Connecticut", type: "property", price: 120, color: "#87CEEB" },
    { index: 10, name: "En la Cárcel / De Visita", type: "corner", price: null, color: null },
    { index: 11, name: "Plaza San Carlos", type: "property", price: 140, color: "#FF69B4" }, // Pink
    { index: 12, name: "Compañía de Electricidad", type: "utility", price: 150, color: "#F0F0F0" },
    { index: 13, name: "Avenida Estados", type: "property", price: 140, color: "#FF69B4" },
    { index: 14, name: "Avenida Virginia", type: "property", price: 160, color: "#FF69B4" },
    { index: 15, name: "Ferrocarril Pennsylvania", type: "transport", price: 200, color: "#000000" },
    { index: 16, name: "Plaza St. James", type: "property", price: 180, color: "#FFA500" }, // Orange
    { index: 17, name: "Arca Comunal", type: "chest", price: null, color: null },
    { index: 18, name: "Avenida Tennessee", type: "property", price: 180, color: "#FFA500" },
    { index: 19, name: "Avenida Nueva York", type: "property", price: 200, color: "#FFA500" },
    { index: 20, name: "Parada Libre", type: "corner", price: null, color: null },
    { index: 21, name: "Avenida Kentucky", type: "property", price: 220, color: "#FF0000" }, // Red
    { index: 22, name: "Fortuna", type: "chance", price: null, color: null },
    { index: 23, name: "Avenida Indiana", type: "property", price: 220, color: "#FF0000" },
    { index: 24, name: "Avenida Illinois", type: "property", price: 240, color: "#FF0000" },
    { index: 25, name: "Ferrocarril B. & O.", type: "transport", price: 200, color: "#000000" },
    { index: 26, name: "Avenida Atlántico", type: "property", price: 260, color: "#FFFF00" }, // Yellow
    { index: 27, name: "Avenida Ventnor", type: "property", price: 260, color: "#FFFF00" },
    { index: 28, name: "Compañía de Agua", type: "utility", price: 150, color: "#F0F0F0" },
    { index: 29, name: "Jardines Marvin", type: "property", price: 280, color: "#FFFF00" },
    { index: 30, name: "Váyase a la Cárcel", type: "corner", price: null, color: null },
    { index: 31, name: "Avenida Pacífico", type: "property", price: 300, color: "#008000" }, // Green
    { index: 32, name: "Avenida Carolina del Norte", type: "property", price: 300, color: "#008000" },
    { index: 33, name: "Arca Comunal", type: "chest", price: null, color: null },
    { index: 34, name: "Avenida Pennsylvania", type: "property", price: 320, color: "#008000" },
    { index: 35, name: "Ferrocarril Vía Rápida", type: "transport", price: 200, color: "#000000" },
    { index: 36, name: "Fortuna", type: "chance", price: null, color: null },
    { index: 37, name: "Plaza Park", type: "property", price: 350, color: "#00008B" }, // Dark Blue
    { index: 38, name: "Impuesto de Lujo", type: "tax", price: 100, color: null },
    { index: 39, name: "El Muelle", type: "property", price: 400, color: "#00008B" },
];

export const getSpaceName = (index: number) => {
    return BOARD_SPACES[index % 40]?.name || `Square ${index}`;
};
