// app/api/r2/delete-all/route.ts (App Router)
import { NextResponse } from "next/server";
import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ListObjectsV2Output,
} from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

const bucket = process.env.R2_BUCKET_NAME!;

export async function DELETE() {
  try {
    let ContinuationToken: string | undefined = undefined;
    let totalDeleted = 0;

    do {
      const listResponse = (await r2.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken,
        })
      )) as ListObjectsV2Output;

      const objects =
        listResponse.Contents?.map((obj) => ({ Key: obj.Key! })) ?? [];

      if (objects.length > 0) {
        await r2.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: objects },
          })
        );
        totalDeleted += objects.length;
      }

      ContinuationToken = listResponse.IsTruncated
        ? listResponse.NextContinuationToken
        : undefined;
    } while (ContinuationToken);

    return NextResponse.json({
      message: `Deleted ${totalDeleted} objects from ${bucket}`,
    });
  } catch (error) {
    console.error("Error deleting R2 objects:", error);
    return NextResponse.json(
      { error: "Failed to delete objects" },
      { status: 500 }
    );
  }
}
