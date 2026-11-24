// Prueba «La ley del cargador»: lo mismo que fconstitucion.mjs, con su slug.
// Uso: node fcargador.mjs [--rapido]
process.argv.splice(2, 0, 'la-ley-del-cargador');
await import('./fconstitucion.mjs');
