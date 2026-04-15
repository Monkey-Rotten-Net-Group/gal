import { createBrowserRouter } from "react-router";
import { StoryEditor } from "./components/StoryEditor";
import { AssetManager } from "./components/AssetManager";
import { ProjectHome } from "./components/ProjectHome";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ProjectHome,
  },
  {
    path: "/editor/:projectId",
    Component: StoryEditor,
  },
  {
    path: "/editor/:projectId/assets",
    Component: AssetManager,
  },
]);
