import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "3D Gaussian Splat App" },
    { name: "description", content: "Welcome to 3D Gaussians!" },
  ];
};

export default function Index() {
  return (
    <div className="font-sans p-4">
      
    </div>
  );
}
