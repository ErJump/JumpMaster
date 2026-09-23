# SPEC-0016 — Design

## Dati

```ts
ambience_tracks = { id, campaignId → CASCADE, name, file, mime, sizeBytes, createdAt }
ambience_scenes = { id, campaignId → CASCADE, name, icon, position, layers: json Layer[], createdAt, updatedAt }

Layer = { id, kind: 'synth', sound: SynthSound, volume: 0..1 }
      | { id, kind: 'track', trackId: number, volume: 0..1 }
SynthSound = 'rain' | 'wind' | 'fire' | 'drips' | 'thunder' | 'waves' | 'crickets'
```

Un file audio appartiene a una traccia (I8): eliminare la traccia cancella il file e toglie lo
strato dalle scene. L'**archivio** esporta tracce (con i file) e scene, e all'import rimappa
`trackId` come fa con `characterId`.

## Moduli

```
src/core/ambience/         puro: tipi, scene di base, curve di dissolvenza, tempi casuali (+ test)
src/lib/audio-type.ts      riconoscimento dai byte (+ test)
src/db/files.ts            saveAudioBytes, nomi `<uuid>.<ext>` anche per l'audio
src/features/ambience/
  engine/                  Web Audio, solo browser: sintetizzatori e mixer
  components/AmbienceProvider.tsx   contesto nel layout del DM: sopravvive ai cambi di pagina
  components/AmbienceBar.tsx        la barra in alto
  components/SceneBoard.tsx         la pagina
src/app/api/atmosfera/tracce/route.ts   POST: carica una traccia (oltre il limite delle Server Actions)
```

## Motore

Un solo `AudioContext`, creato al primo clic (i browser non lo permettono prima). Ogni scena è un
`GainNode`; ogni strato un sotto-grafo con il suo `GainNode`. Cambiare scena = rampa del guadagno
della vecchia a 0 e della nuova al suo valore, con curva a **potenza costante** (cos/sin): la somma
delle potenze resta 1 e non c'è il «buco» a metà dissolvenza.

Sintesi, tutte da rumore generato una volta in un buffer e filtri:

| Suono | Come |
|---|---|
| pioggia | rumore rosa, passa-alto; gocce singole come brevi scoppi filtrati a tempi casuali |
| vento | rumore marrone, passa-basso con frequenza e volume modulati lentamente (LFO) |
| fuoco | rumore marrone basso + crepitii: scoppi brevissimi, a grappoli, a tempi casuali |
| gocce | sinusoide con caduta di tono + riverbero sintetico, a tempi casuali e radi |
| tuoni | rumore marrone passa-basso con attacco lento e coda lunga, ogni 15–45 s |
| onde | rumore rosa, passa-banda, volume che sale e scende come la risacca (~8 s) |
| grilli | oscillatore acuto modulato a impulsi, a gruppi |

Gli eventi casuali usano un generatore iniettabile: i tempi sono testabili in `core/`.

Le tracce del DM passano da un `<audio loop>` collegato al grafo (`MediaElementSource`): niente
decodifica in memoria di file lunghi.
