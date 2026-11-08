import React from "react";
import { Composition, registerRoot } from "remotion";
import { Pilot } from "./pilot/Pilot";
import { EmuWar } from "./emu/EmuFilm";
import { DURATION } from "./emu/story";

const Root: React.FC = () => (
  <>
    <Composition id="PuroAbsurdo3DPilot" component={Pilot} width={1080} height={1920} fps={30} durationInFrames={180} />
    <Composition id="EmuWar1932" component={EmuWar} width={1080} height={1920} fps={30} durationInFrames={DURATION} />
  </>
);
registerRoot(Root);
