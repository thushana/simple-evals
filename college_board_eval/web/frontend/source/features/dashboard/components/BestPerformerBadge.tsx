import React from "react";
import { Box, Tooltip } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

interface BestPerformerBadgeProps {
  isBest: boolean;
}

export const BestPerformerBadge: React.FC<BestPerformerBadgeProps> = ({
  isBest,
}) => {
  if (!isBest) return null;

  return (
    <Tooltip title="Best performer for this exam">
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          marginRight: 1,
        }}
      >
        <StarIcon
          sx={{
            color: "#FFD700",
            fontSize: "1rem",
          }}
        />
      </Box>
    </Tooltip>
  );
};
