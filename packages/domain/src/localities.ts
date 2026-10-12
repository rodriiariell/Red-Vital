import { z } from "zod";

const localities = [
  "Ciudad Autónoma de Buenos Aires",
  "La Plata",
  "Mar del Plata",
  "Bahía Blanca",
  "Tandil",
  "San Nicolás de los Arroyos",
  "Olavarría",
  "Pergamino",
  "Azul",
  "Avellaneda",
  "Buenos Aires",
  "San Fernando del Valle de Catamarca",
  "Andalgalá",
  "Resistencia",
  "Barranqueras",
  "Rawson",
  "Comodoro Rivadavia",
  "Puerto Madryn",
  "Córdoba",
  "Villa María",
  "Río Cuarto",
  "Villa Carlos Paz",
  "Villa Allende",
  "Alta Gracia",
  "San Francisco",
  "Corrientes",
  "Goya",
  "Paraná",
  "Concordia",
  "Formosa",
  "San Salvador de Jujuy",
  "Santa Rosa",
  "La Rioja",
  "Mendoza",
  "Godoy Cruz",
  "Guaymallén",
  "San Rafael",
  "Posadas",
  "Apóstoles",
  "Neuquén",
  "Bariloche",
  "Viedma",
  "Allen",
  "Salta",
  "San Juan",
  "San Luis",
  "Río Gallegos",
  "Santa Fe",
  "Rosario",
  "Rafaela",
  "Santiago del Estero",
  "Añatuya",
  "Ushuaia",
  "San Miguel de Tucumán",
] as const;

export const normalizeLocality = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es-AR");

const knownLocalities = new Set(localities.map(normalizeLocality));

export const localitySchema = z.string().trim().min(1).max(160).refine(
  (value) => knownLocalities.has(normalizeLocality(value)),
  "Localidad inválida",
);

export const isKnownLocality = (value: string) => knownLocalities.has(normalizeLocality(value));
