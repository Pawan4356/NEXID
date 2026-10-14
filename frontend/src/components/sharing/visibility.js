import { Globe, Lock, Users } from "lucide-react";

export const VISIBILITY = {
  private: {
    label: "Private",
    icon: Lock,
    description: "Only you and people you invite",
  },
  friends: {
    label: "Friends",
    icon: Users,
    description: "People you follow who also follow you",
  },
  public: {
    label: "Public",
    icon: Globe,
    description: "Anyone on Nexid with the link",
  },
};

export const ROLE_LABELS = {
  view: "Can view",
  comment: "Can comment",
  edit: "Can edit",
};
