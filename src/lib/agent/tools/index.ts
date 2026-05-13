// Importar todos os arquivos de tools para registrá-los no registry global
import "./read-event";
import "./read-ranking";
import "./read-member";
import "./read-finance";
import "./read-query";
import "./write-event";
import "./write-rsvp";
import "./write-finance";
import "./write-draw";

export { listTools, getTool, toolToMcpDefinition } from "@/lib/agent/tools-catalog";
