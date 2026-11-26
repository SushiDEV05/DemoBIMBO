import { TurnoCodigo } from '../types/database.types';

export interface InfoTurno {
  turno: TurnoCodigo;
  nombreTurno: string;
  fechaTurno: string; // YYYY-MM-DD
  horaActualLima: string;
}

/**
 * Calcula el turno y la fecha de jornada operativa en zona horaria America/Lima.
 * Cruce de medianoche: Si la hora local está entre 00:00 y 05:59:59, la jornada pertenece a la fecha de ayer.
 */
export function calcularTurnoActualLima(fechaReferencia: Date = new Date()): InfoTurno {
  // Convertir a tiempo de Lima (UTC-5)
  const formatoLima = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const partes = formatoLima.formatToParts(fechaReferencia);
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));

  const anio = parseInt(mapa.year, 10);
  const mes = parseInt(mapa.month, 10) - 1;
  const dia = parseInt(mapa.day, 10);
  const hora = parseInt(mapa.hour, 10);
  const minuto = parseInt(mapa.minute, 10);

  const fechaLocal = new Date(Date.UTC(anio, mes, dia));

  let turno: TurnoCodigo;
  let nombreTurno: string;
  let fechaTurnoDate = new Date(fechaLocal);

  if (hora >= 6 && hora < 14) {
    turno = 'MANANA';
    nombreTurno = 'Turno Mañana (06:00 - 14:00)';
  } else if (hora >= 14 && hora < 22) {
    turno = 'TARDE';
    nombreTurno = 'Turno Tarde (14:00 - 22:00)';
  } else {
    turno = 'NOCHE';
    nombreTurno = 'Turno Noche (22:00 - 06:00)';
    // Si estamos en la madrugada antes de las 6:00 AM, la fecha operativa es la de ayer
    if (hora < 6) {
      fechaTurnoDate.setUTCDate(fechaTurnoDate.getUTCDate() - 1);
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const fechaTurnoStr = `${fechaTurnoDate.getUTCFullYear()}-${pad(fechaTurnoDate.getUTCMonth() + 1)}-${pad(fechaTurnoDate.getUTCDate())}`;
  const horaActualStr = `${pad(hora)}:${pad(minuto)}`;

  return {
    turno,
    nombreTurno,
    fechaTurno: fechaTurnoStr,
    horaActualLima: horaActualStr,
  };
}
