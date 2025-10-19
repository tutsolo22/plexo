import React from 'react'
import Image from 'next/image'

export function PlexoLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo real con modo oscuro/claro */}
      <div className="relative">
        {/* Logo para modo claro */}
        <Image
          src="/images/logos/plexo-light.png"
          alt="Plexo"
          width={32}
          height={32}
          className="h-8 w-auto dark:hidden"
          priority
        />
        {/* Logo para modo oscuro */}
        <Image
          src="/images/logos/plexo-dark.png"
          alt="Plexo"
          width={32}
          height={32}
          className="h-8 w-auto hidden dark:block"
          priority
        />
      </div>
      
      {/* Nombre */}
      <span className="text-xl font-bold text-plexo-primary dark:text-plexo-dark-lavender">
        Plexo
      </span>
    </div>
  )
}

export function PlexoBranding() {
  return (
    <div className="text-center space-y-4">
      {/* Logo grande para página principal */}
      <div className="mx-auto relative">
        <Image
          src="/images/logos/plexo-light.png"
          alt="Plexo"
          width={80}
          height={80}
          className="mx-auto dark:hidden"
          priority
        />
        <Image
          src="/images/logos/plexo-dark.png"
          alt="Plexo"
          width={80}
          height={80}
          className="mx-auto hidden dark:block"
          priority
        />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-plexo-primary dark:text-plexo-dark-lavender">
          Plexo
        </h1>
        <p className="text-lg text-plexo-secondary dark:text-plexo-dark-text-secondary mt-2">
          Tu centro de operaciones para eventos inolvidables
        </p>
      </div>
    </div>
  )
}