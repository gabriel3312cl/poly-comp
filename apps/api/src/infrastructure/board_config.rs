#![allow(dead_code)]
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct BoardSpace {
    pub index: i32,
    pub name: &'static str,
    pub type_: SpaceType, // Street, Railroad, Utility, Tax, Corner, Chance, Chest
    pub color_group: Option<&'static str>, // For UI coloring
    pub price: Option<i32>, // Display purposes
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum SpaceType {
    Street,
    Railroad,
    Utility,
    Tax,
    Corner, // Go, Jail, Free Parking, Go To Jail
    Chance, // Fortuna
    CommunityChest, // Arca Comunal
}

pub const BOARD_SPACES: [BoardSpace; 40] = [
    // Bottom (South)
    BoardSpace { index: 0, name: "Salida", type_: SpaceType::Corner, color_group: None, price: None },
    BoardSpace { index: 1, name: "Avenida Mediterráneo", type_: SpaceType::Street, color_group: Some("brown"), price: Some(60) },
    BoardSpace { index: 2, name: "Arca Comunal", type_: SpaceType::CommunityChest, color_group: None, price: None },
    BoardSpace { index: 3, name: "Avenida Báltica", type_: SpaceType::Street, color_group: Some("brown"), price: Some(60) },
    BoardSpace { index: 4, name: "Impuesto sobre Ingresos", type_: SpaceType::Tax, color_group: None, price: Some(200) },
    BoardSpace { index: 5, name: "Ferrocarril Reading", type_: SpaceType::Railroad, color_group: None, price: Some(200) },
    BoardSpace { index: 6, name: "Avenida Oriental", type_: SpaceType::Street, color_group: Some("light_blue"), price: Some(100) },
    BoardSpace { index: 7, name: "Fortuna", type_: SpaceType::Chance, color_group: None, price: None },
    BoardSpace { index: 8, name: "Avenida Vermont", type_: SpaceType::Street, color_group: Some("light_blue"), price: Some(100) },
    BoardSpace { index: 9, name: "Avenida Connecticut", type_: SpaceType::Street, color_group: Some("light_blue"), price: Some(120) },
    
    // Left (West) - Visit / Jail
    BoardSpace { index: 10, name: "En la Cárcel / De Visita", type_: SpaceType::Corner, color_group: None, price: None },
    BoardSpace { index: 11, name: "Plaza San Carlos", type_: SpaceType::Street, color_group: Some("pink"), price: Some(140) },
    BoardSpace { index: 12, name: "Compañía de Electricidad", type_: SpaceType::Utility, color_group: None, price: Some(150) },
    BoardSpace { index: 13, name: "Avenida Estados", type_: SpaceType::Street, color_group: Some("pink"), price: Some(140) },
    BoardSpace { index: 14, name: "Avenida Virginia", type_: SpaceType::Street, color_group: Some("pink"), price: Some(160) },
    BoardSpace { index: 15, name: "Ferrocarril Pennsylvania", type_: SpaceType::Railroad, color_group: None, price: Some(200) },
    BoardSpace { index: 16, name: "Plaza St. James", type_: SpaceType::Street, color_group: Some("orange"), price: Some(180) },
    BoardSpace { index: 17, name: "Arca Comunal", type_: SpaceType::CommunityChest, color_group: None, price: None },
    BoardSpace { index: 18, name: "Avenida Tennessee", type_: SpaceType::Street, color_group: Some("orange"), price: Some(180) },
    BoardSpace { index: 19, name: "Avenida Nueva York", type_: SpaceType::Street, color_group: Some("orange"), price: Some(200) },
    
    // Top (North)
    BoardSpace { index: 20, name: "Parada Libre", type_: SpaceType::Corner, color_group: None, price: None },
    BoardSpace { index: 21, name: "Avenida Kentucky", type_: SpaceType::Street, color_group: Some("red"), price: Some(220) },
    BoardSpace { index: 22, name: "Fortuna", type_: SpaceType::Chance, color_group: None, price: None },
    BoardSpace { index: 23, name: "Avenida Indiana", type_: SpaceType::Street, color_group: Some("red"), price: Some(220) },
    BoardSpace { index: 24, name: "Avenida Illinois", type_: SpaceType::Street, color_group: Some("red"), price: Some(240) },
    BoardSpace { index: 25, name: "Ferrocarril B. & O.", type_: SpaceType::Railroad, color_group: None, price: Some(200) },
    BoardSpace { index: 26, name: "Avenida Atlántico", type_: SpaceType::Street, color_group: Some("yellow"), price: Some(260) },
    BoardSpace { index: 27, name: "Avenida Ventnor", type_: SpaceType::Street, color_group: Some("yellow"), price: Some(260) },
    BoardSpace { index: 28, name: "Compañía de Agua", type_: SpaceType::Utility, color_group: None, price: Some(150) },
    BoardSpace { index: 29, name: "Jardines Marvin", type_: SpaceType::Street, color_group: Some("yellow"), price: Some(280) },
    
    // Right (East)
    BoardSpace { index: 30, name: "Váyase a la Cárcel", type_: SpaceType::Corner, color_group: None, price: None },
    BoardSpace { index: 31, name: "Avenida Pacífico", type_: SpaceType::Street, color_group: Some("green"), price: Some(300) },
    BoardSpace { index: 32, name: "Avenida Carolina del Norte", type_: SpaceType::Street, color_group: Some("green"), price: Some(300) },
    BoardSpace { index: 33, name: "Arca Comunal", type_: SpaceType::CommunityChest, color_group: None, price: None },
    BoardSpace { index: 34, name: "Avenida Pennsylvania", type_: SpaceType::Street, color_group: Some("green"), price: Some(320) },
    BoardSpace { index: 35, name: "Ferrocarril Vía Rápida", type_: SpaceType::Railroad, color_group: None, price: Some(200) },
    BoardSpace { index: 36, name: "Fortuna", type_: SpaceType::Chance, color_group: None, price: None },
    BoardSpace { index: 37, name: "Plaza Park", type_: SpaceType::Street, color_group: Some("dark_blue"), price: Some(350) },
    BoardSpace { index: 38, name: "Impuesto de Lujo", type_: SpaceType::Tax, color_group: None, price: Some(100) },
    BoardSpace { index: 39, name: "El Muelle", type_: SpaceType::Street, color_group: Some("dark_blue"), price: Some(400) },
];

pub fn get_space(index: i32) -> &'static BoardSpace {
    let i = index.rem_euclid(40) as usize; // Safely handle loop
    &BOARD_SPACES[i]
}
