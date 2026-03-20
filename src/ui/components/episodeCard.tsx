"use client";

import Link from "next/link";

export default function EpisodeCard({ id }: { id: string }) {
    return (
			<div className="bg-[#1e1e1e] text-white p-4 rounded-xl shadow-lg flex flex-col gap-1 max-w-5xl mx-2 mb-4 relative">
        {/* Poster + Modifier */}
        <Link
					className="absolute top-2 right-2 flex px-2 py-1 items-center gap-2 bg-primary rounded-md cursor-pointer"
					href={"/dashboard/series/detail/" + id}
        >
					<span className="text-sm">Voir</span>
        </Link>
        <div className="flex flex-col items-center">
					<img
						src="/image-icon.jpg"
						alt="Poster"
						className="w-24 h-24 object-cover rounded-md"
					/>
        </div>
        <div className="flex flex-col justify-between mb-10">
					<h4>Episode 01</h4>
					<h3 className="text-sm">Titre de l&apos;épisode</h3>
					<p className="text-sm text-neutral-400">Durée : 45 min</p>
        </div>
				<div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
					<button className="btn btn-sm btn-outline btn-info p-1">
						Modifier
					</button>
					<button className="btn btn-sm btn-outline btn-error p-1 ">
						Supprimer
					</button>	
				</div>
			</div>
    );
}
