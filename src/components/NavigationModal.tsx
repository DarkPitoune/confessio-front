import Image from "next/image";
import Link from "next/link";

const NavigationModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-deepblue/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="rounded-xl py-4 px-8 bg-deepblue gap-4 flex flex-col items-stretch justify-center w-4/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2 items-center justify-center">
          <Image
            src="/confessioLogoWhite.svg"
            alt="Confession Logo"
            width={24}
            height={24}
          />
          <h2 className="font-semibold">Confessio</h2>
        </div>
        <div className="flex flex-col gap-0.5 items-center justify-cente text-sm">
          <Link
            className="py-2 bg-white text-deepblue w-full text-center rounded-t-xl"
            href="https://confessio.fr/contact"
          >
            Nous contacter
          </Link>
          <Link
            className="py-2 bg-white text-deepblue w-full text-center"
            href="https://confessio.fr/about"
          >
            Qui sommes-nous ?
          </Link>
          <Link
            className="py-2 bg-white text-deepblue w-full text-center"
            href="https://www.leetchi.com/fr/c/confessio--participation-aux-frais-de-serveur-3379251"
          >
            Nous soutenir
          </Link>
          <Link
            className="py-2 bg-white text-deepblue w-full text-center"
            href="https://confessio.fr/api/docs"
          >
            API
          </Link>
          <Link
            className="py-2 bg-white text-deepblue w-full text-center rounded-b-xl"
            href="https://confessio.fr/accounts/login/"
          >
            Espace Administrateur
          </Link>
        </div>
        <p className="text-xs text-gray-300 text-center">
          Code open-source disponible sur{" "}
          <Link
            href="https://github.com/etiennecallies/confessio"
            className="underline"
          >
            Github
          </Link>
          <br />
          Made in 🇫🇷 with ✝️ without 🍪
        </p>
      </div>
    </div>
  );
};

export { NavigationModal };
