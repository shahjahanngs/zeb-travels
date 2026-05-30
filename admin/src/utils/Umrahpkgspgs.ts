import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/images/logo.png";

// --- Interfaces ---

interface Flight {
  flightNo?: string;
  airline?: string;
  sectorFrom: string;
  sectorTo: string;
  depDate: string | Date;
  depTime?: string;
  arrDate?: string | Date;
  arrTime?: string;
}

interface Hotel {
  name?: string;
  rating?: number;
  location?: {
    city?: string;
    distance?: number | string;
  };
}

interface Transport {
  route?: string;
  transportType?: string;
}

interface Rooms {
  double?: number;
  triple?: number;
  quad?: number;
  quint?: number;
  sharing?: number;
  childWithoutPackage?: number;
  InfantWithoutPackage?: number;
  [key: string]: number | undefined;
}

interface UmrahPackage {
  packageName?: string;
  days?: number;
  nightCount?: string;

  hotels?: Hotel[];
  transports?: Transport[];
  rooms?: Rooms;

  groupTicket?: {
    flights?: Flight[];
  };
}

interface RoomStyle {
  bg: [number, number, number];
  text: [number, number, number];
  border: [number, number, number];
}

// --- Helper Functions ---

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "N/A";

  const d = new Date(date);

  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const getRoomColor = (roomType: string): RoomStyle => {
  const colors: Record<string, RoomStyle> = {
    double: {
      bg: [255, 251, 235],
      text: [146, 64, 14],
      border: [254, 243, 199],
    },

    triple: {
      bg: [240, 253, 244],
      text: [22, 101, 52],
      border: [187, 247, 208],
    },

    quad: {
      bg: [250, 245, 255],
      text: [107, 33, 168],
      border: [233, 213, 255],
    },

    quint: {
      bg: [254, 242, 242],
      text: [153, 27, 27],
      border: [254, 226, 226],
    },

    sharing: {
      bg: [240, 249, 255],
      text: [7, 89, 133],
      border: [186, 230, 253],
    },

    childWithoutPackage: {
      bg: [254, 249, 195],
      text: [133, 77, 14],
      border: [253, 224, 71],
    },

    InfantWithoutPackage: {
      bg: [224, 231, 255],
      text: [55, 48, 163],
      border: [165, 180, 252],
    },
  };

  return (
    colors[roomType] || {
      bg: [249, 250, 251],
      text: [31, 41, 55],
      border: [229, 231, 235],
    }
  );
};

// --- Main Generator ---

export const generateUmrahPackagesPDF = async (
  packages: UmrahPackage[],
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      console.log(packages);

      const doc = new jsPDF("p", "mm", "a4");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let yPosition = 15;

      const checkPageBreak = (neededSpace: number): boolean => {
        if (yPosition + neededSpace > pageHeight - 15) {
          doc.addPage();
          yPosition = 15;
          return true;
        }

        return false;
      };

      // ========== BRAND HEADER ==========

      doc.setFillColor(22, 78, 99);
      doc.rect(0, 0, pageWidth, 12, "F");

      yPosition = 22;

      doc.addImage(logo, "PNG", 15, yPosition - 5, 12, 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(22, 78, 99);

      doc.text("AL - MAMOORAH INTERNATIONAL PVT LTD", 30, yPosition);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);

      doc.text("Special Umrah Offers", 30, yPosition + 4);

      doc.setFontSize(8);

      doc.text(`Total Packages: ${packages.length}`, pageWidth - 50, yPosition);

      doc.text(
        `Date: ${new Date().toLocaleDateString()}`,
        pageWidth - 50,
        yPosition + 4,
      );

      yPosition += 12;

      // ========== PACKAGES LOOP ==========

      packages.forEach((pkg, index) => {
        checkPageBreak(70);

        const boxStartY = yPosition;

        // PACKAGE TITLE

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);

        doc.text(
          `${index + 1}. ${pkg.packageName || "Umrah Package"}`,
          17,
          yPosition + 5,
        );

        // DAYS

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);

        const durationText = `${pkg.days || 0} DAYS / ${
          pkg.nightCount || "-"
        } NIGHTS`;

        doc.text(durationText, pageWidth - 17, yPosition + 5, {
          align: "right",
        });

        yPosition += 8;

        const tableWidth = (pageWidth - 34) / 2;

        // ========== FLIGHT TABLE ==========

        autoTable(doc, {
          startY: yPosition,

          head: [["Flight", "Route", "Date"]],

          body: (pkg.groupTicket?.flights || [])
            .slice(0, 2)
            .map((f) => [
              `${f.airline || ""} ${f.flightNo || "-"}`,
              `${f.sectorFrom}>${f.sectorTo}`,
              `${formatDate(f.depDate)} ${f.depTime || ""}`,
            ]),

          margin: { left: 15 },

          tableWidth: tableWidth,

          theme: "grid",

          styles: {
            fontSize: 7,
            cellPadding: 1.5,
          },

          headStyles: {
            fillColor: [51, 65, 85],
          },
        });

        // ========== HOTEL TABLE ==========

        autoTable(doc, {
          startY: yPosition,

          head: [["Hotel", "City", "Dist."]],

          body: (pkg.hotels || [])
            .slice(0, 2)
            .map((h) => [
              h.name || "Standard",

              h.location?.city || "-",

              h.location?.distance ? `${h.location.distance}m` : "-",
            ]),

          margin: {
            left: 15 + tableWidth + 4,
          },

          tableWidth: tableWidth,

          theme: "grid",

          styles: {
            fontSize: 7,
            cellPadding: 1.5,
          },

          headStyles: {
            fillColor: [71, 85, 105],
          },
        });

        // LAST TABLE POSITION

        yPosition = (doc as any).lastAutoTable.finalY + 4;

        // ========== TRANSPORT INFO ==========

        if (pkg.transports?.length) {
          doc.setFontSize(7);

          doc.setTextColor(75, 85, 99);

          const transportText = pkg.transports
            .map((t) => `${t.transportType || "-"} (${t.route || "-"})`)
            .join(" | ");

          doc.text(`Transport: ${transportText}`, 15, yPosition);

          yPosition += 6;
        }

        // ========== PRICING CARDS ==========

        const rooms = pkg.rooms || {};

        const activeRooms = [
          "sharing",
          "quint",
          "quad",
          "triple",
          "double",
          "childWithoutPackage",
          "InfantWithoutPackage",
        ].filter((r) => rooms[r] && (rooms[r] as number) > 0);

        let xPos = 15;

        const cardWidth = (pageWidth - 30) / activeRooms.length;

        const roomLabelMap: Record<string, string> = {
          sharing: "SHARING",
          quint: "QUINT",
          quad: "QUAD",
          triple: "TRIPLE",
          double: "DOUBLE",
          childWithoutPackage: "CHILD",
          InfantWithoutPackage: "INFANT",
        };

        activeRooms.forEach((roomType) => {
          const color = getRoomColor(roomType);

          const price = rooms[roomType];

          doc.setFillColor(color.bg[0], color.bg[1], color.bg[2]);

          doc.roundedRect(xPos, yPosition, cardWidth - 2, 10, 1, 1, "F");

          doc.setDrawColor(color.border[0], color.border[1], color.border[2]);

          doc.roundedRect(xPos, yPosition, cardWidth - 2, 10, 1, 1, "S");

          doc.setFontSize(6);

          doc.setTextColor(color.text[0], color.text[1], color.text[2]);

          doc.setFont("helvetica", "bold");

          doc.text(
            roomLabelMap[roomType] || roomType.toUpperCase(),
            xPos + 2,
            yPosition + 3.5,
          );

          doc.setFontSize(7.5);

          doc.text(
            `${Number(price).toLocaleString()}`,
            xPos + 2,
            yPosition + 8,
          );

          xPos += cardWidth;
        });

        yPosition += 15;

        // OUTER BOX

        doc.setDrawColor(226, 232, 240);

        doc.rect(15, boxStartY, pageWidth - 30, yPosition - boxStartY - 3);

        yPosition += 2;
      });

      // ========== FOOTER ==========

      const pageCount = doc.getNumberOfPages();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFontSize(7);

        doc.setTextColor(148, 163, 184);

        doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);

        doc.text(
          "AL - MAMOORAH INTERNATIONAL PVT LTD | Premium Service | All Rights Reserved",
          pageWidth / 2,
          pageHeight - 8,
          {
            align: "center",
          },
        );

        doc.text(`Page ${i} / ${pageCount}`, pageWidth - 20, pageHeight - 8);
      }

      doc.save(`WorldFly_Umrah_Offers.pdf`);

      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};
