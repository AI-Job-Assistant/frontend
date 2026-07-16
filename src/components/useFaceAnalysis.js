// src/components/useFaceAnalysis.js
import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const url = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(url),
    faceapi.nets.faceLandmark68Net.loadFromUri(url),
    faceapi.nets.faceExpressionNet.loadFromUri(url),
  ]);
  modelsLoaded = true;
}

/* 랜드마크로 정면 응시 여부 추정 (코끝이 얼굴 중앙에 있으면 정면) */
function isLookingAtCamera(landmarks) {
  const nose = landmarks.getNose();
  const jaw = landmarks.getJawOutline();
  const noseTipX = nose[3].x;
  const faceLeftX = jaw[0].x;
  const faceRightX = jaw[jaw.length - 1].x;
  const faceCenterX = (faceLeftX + faceRightX) / 2;
  const faceWidth = faceRightX - faceLeftX;
  const offset = Math.abs(noseTipX - faceCenterX) / faceWidth;
  return offset < 0.12;
}

export function useFaceAnalysis(videoRef, active) {
  const [stats, setStats] = useState({ smiles: 0, gazeRate: 0 });
  const [detection, setDetection] = useState(null);
  const accum = useRef({ frames: 0, gazeFrames: 0, smiles: 0, wasSmiling: false });
  const timerId = useRef(null);
  const ready = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      await loadModels();
      ready.current = true;
    })();

    const detect = async () => {
      const video = videoRef.current;
      if (ready.current && video && video.readyState === 4) {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (result) {
          const a = accum.current;
          a.frames++;
          if (isLookingAtCamera(result.landmarks)) a.gazeFrames++;

          const happy = result.expressions.happy;
          if (happy > 0.7) {
            if (!a.wasSmiling) { a.smiles++; a.wasSmiling = true; }
          } else if (happy < 0.4) {
            a.wasSmiling = false;
          }

          setStats({
            smiles: a.smiles,
            gazeRate: Math.round((a.gazeFrames / a.frames) * 100),
          });
          setDetection(result.detection.box); // 얼굴 위치 저장
        } else{
          setDetection(null);
        }
      }
      if (!cancelled) timerId.current = setTimeout(detect, 250);
    };

    detect();
    return () => { cancelled = true; clearTimeout(timerId.current); };
  }, [active, videoRef]);

  const resetStats = () => {
    accum.current = { frames: 0, gazeFrames: 0, smiles: 0, wasSmiling: false };
    setStats({ smiles: 0, gazeRate: 0 });
  };
  return { stats, resetStats, detection };
}